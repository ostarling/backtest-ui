import React from 'react';
import StatsPanel from './StatsPanel.js'
import CandleChart from './CandleChart'

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card, { CardBody } from 'react-bootstrap/Card';
import PnLChart from './PnLChart'
import CandleChartOverview from './CandleChartOverview'


class Tracker {
    constructor(depth){
        this.depth = depth
        this.changes = []
    }
    addValue(value){
        if(this.last){
            this.changes.push(value-this.last)
            if(this.changes.length >= this.depth)
                this.changes = this.changes.slice(1)
        }
        this.last = value
    }
    getTrend(){
        // returns 1 or -1 for a trend, 0 otherwise
        if(this.changes.length === this.depth){
            if(Math.max(...this.changes) < 0)
                return -1
            if(Math.min(...this.changes) > 0)
                return 1
        }
        return 0
    }
    getMagnitude(){
        if(this.changes.length === this.depth)
            return Math.abs(this.changes.reduce((a,b)=>a+b))
        else
            return 0
    }
}

class RandomTradeEventsSource {

    constructor(qty){
        this.qty = qty

        this.tradeState = null

        this.tracker = {
            highTracker: new Tracker(3),
            lowTracker: new Tracker(3)
        }
    }

    // highProfitInPips = 20

    nextEvent(accum, candle){

        // const maxTradeBreakIntoProfitWait = 20 //ticks

        const statusInitial = "statusInitial"
        const statusBecameNonLoss = "statusBecameNonLoss"
        const statusProfitBecameLoss = "statusProfitBecameLoss"

        const closeEvent = { type:"close", index: 0  }

        this.tracker.highTracker.addValue(candle.high*10000)
        this.tracker.lowTracker.addValue(candle.low*10000)
        
        if(accum.trades.length > 0){
            const trade = accum.trades[0]
            this.tradeState.trade = Object.assign({}, trade)
            this.tradeState.ticksInStatus = this.tradeState.ticksInStatus + 1
            if(this.tradeState.lastPnl){
                if(this.tradeState.status===statusInitial && trade.pips >= 2){
                    this.tradeState.status = statusBecameNonLoss
                    this.tradeState.ticksInStatus = 0
                    this.tradeState.highestPnl = trade.pnl
                    this.tradeState.decreasingProfit = false

                } else if(this.tradeState.status===statusBecameNonLoss){
                    this.tradeState.highestPnl = Math.max(this.tradeState.highestPnl, trade.pnl)
                    if( (this.tradeState.highestPnl - trade.pnl) / this.tradeState.highestPnl > 0.3){
                        this.tradeState.decreasingProfit = true
                    }

                    if(this.tradeState.lastPnl>=0 && trade.pnl < 0){
                        this.tradeState.status = statusProfitBecameLoss
                        this.tradeState.ticksInStatus = 0
                    }
                }

                this.tradeState.pnlChange = trade.pnl - this.tradeState.lastPnl
            } else {
                this.tradeState.pnlChange = 0
            }
            this.tradeState.lastPnl = trade.pnl

            if(this.tradeState.status === statusBecameNonLoss){
                // in profit
                if(
                    // close if high enough and falling growing
                    (trade.pips > 20 && this.tradeState.pnlChange < 0)
                    ||
                    // or if the winner is going to become a looser
                    (trade.pips < 2 && this.tradeState.pnlChange < 0 && this.tradeState.ticksInStatus > 10)
                    ||
                    this.tradeState.decreasingProfit
                ){
                    console.log("closing 1", this.tradeState)

                    return closeEvent
                }

            } else  if(this.tradeState.status === statusInitial){
                // in loss
                // going below max loss or been a looser for too long
                if(trade.pips < -5 || this.tradeState.ticksInStatus>30){
                    console.log("closing 2", this.tradeState)
                    return closeEvent
                }
            } else if(this.tradeState.status === statusProfitBecameLoss){
                console.log("closing 3", this.tradeState)
                return closeEvent
            }
        } else {
            // book a new trade?
            // TODO revise the opening strategy
            const minMagnitude = 0.1

            this.tracker.trendHi = this.tracker.highTracker.getTrend()
            this.tracker.trendLo = this.tracker.lowTracker.getTrend()
            this.tracker.magnHi = this.tracker.highTracker.getMagnitude()
            this.tracker.magnLo = this.tracker.lowTracker.getMagnitude()

            this.tracker.trend = 0
            if( (this.tracker.trendHi === 1 && this.tracker.trendLo > -1) 
                || (this.tracker.trendLo === 1 && this.tracker.trendHi > -1) ){
                this.tracker.trend = 1
            }
            if( (this.tracker.trendHi === -1 && this.tracker.trendLo < 1) 
                || (this.tracker.trendLo === -1 && this.tracker.trendHi < 1)){
                this.tracker.trend = -1
            }
            if(true || this.tracker.trend !== 0 && Math.max(this.tracker.magnHi,this.tracker.magnLo) > minMagnitude){
                this.tradeState = {
                    ticksInStatus: 0,
                    status: statusInitial,
                }
                return {
                    type: "open",
                    qty: this.qty,
                    side: 1,//this.tracker.trend,
                    instr: "EUR_USD"
                }                
            }
            
        }        
        return {type: "noop"}
    }
}


class BacktestStrategyEventsSource {

    constructor(candleData, tradeEventSource, startBalance, leverage, fxRate, startingCandleIndex){
        this.candles = candleData
        this.tradeStateEventSource = tradeEventSource
        this.startBalance = startBalance
        this.leverage = leverage
        this.fxRate = fxRate || 1.0
        this.eventsMap = {}
        this.events = []

        this.accum = {
            startingBalance: startBalance,
            balance: startBalance,
            netAssetValue: startBalance,
            realisedPnl: 0,
            unrealisedPnl: 0,
            maxDrawdown: 0,
            marginUsed: 0,
            trades: [], // {price, qty, side},
            log: [] // one of (open) {time, price, qty, side} or (close) {time,price, qty, pnl, pips}
        }

        this.candleIndex = startingCandleIndex || 0
    }

    eventFor(timestamp){
        return this.eventsMap[timestamp]
    }

    compute(){
        for(let index in this.candles){
            const candle = this.candles[index]
            const evt = this.__nextEvent(candle)
            this.events.push(evt)
            this.eventsMap[candle.time] = evt
        }
    }


    deepCloneAccum(a1){
        let a2 = Object.assign({}, a1)
        a2.trades = a2.trades.slice(0)
        for(let i in a2.trades){
            a2.trades[i] = Object.assign({}, a2.trades[i])
        }
        a2.log = a2.log.slice(0) // no need to clone the elements
        return a2
    }

    __nextEvent(candle){

        // candles have: { time, open, close, high, low}
        
        let accum = this.deepCloneAccum(this.accum)
        this.accum = accum

        const price = candle.close // TODO add spread
        accum.price = price
        const spread = 0.00015
        for(let i in accum.trades){
            const trade = accum.trades[i]
            trade.pnl = trade.side * (price - trade.price) * trade.qty
            trade.pips = trade.side*(price-trade.price)*10000
            trade.ticks = trade.ticks + 1
        }
        const evt = this.tradeStateEventSource.nextEvent(accum, candle)

        if(evt.type === "close"){
            const trade = accum.trades.splice(evt.index,1)[0]
            accum.realisedPnl += trade.pnl
            accum.log.push({type:"close", instr: trade.instr, time:candle.time, price:price, qty: trade.qty, side: trade.side, pnl: trade.pnl, pips: trade.pips})
        } if (evt.type === "open") {
            const openPrice = price + evt.side * spread
            const trade = {qty: evt.qty, side: evt.side, price: openPrice, ticks: 0, pnl:0, pips:0, time: candle.time }
            accum.trades.push(trade)
            accum.log.push({type:"open", instr: evt.instr, time:trade.time, price:trade.price, qty: trade.qty, side: trade.side})
        }
        if(accum.trades.length>0){
            accum.unrealisedPnl = accum.trades.map(trade => trade.pnl).reduce((a,b)=>a+b)
            accum.marginUsed = accum.trades.map(trade => candle.close * trade.qty / this.leverage).reduce((a,b)=>a+b)
        } else {
            accum.unrealisedPnl = 0
            accum.marginUsed = 0
        }
        accum.balance = accum.startingBalance + accum.realisedPnl
        accum.netAssetValue = accum.balance + accum.unrealisedPnl
        accum.time = candle.time

        // console.log(candle, accum)
        accum.tradeState = Object.assign({}, this.tradeStateEventSource.tradeState)
        accum.tracker = Object.assign({}, this.tradeStateEventSource.tracker)
        accum.tracker.highTracker = Object.assign({}, this.tradeStateEventSource.tracker.highTracker)
        accum.tracker.lowTracker = Object.assign({}, this.tradeStateEventSource.tracker.lowTracker)
        return accum
    }

}



class BacktestReplay extends React.Component {

    constructor(props){
        super(props)
        const {strategyEvents, candles, height, width} = this.props;

        this.candles = candles
        this.strategyEvents = strategyEvents
        this.height = height
        this.width = width
        // console.log(candles)
        this.unrealisedPnlSeries = strategyEvents.events.map(e => { return {time:e.time, value:e.unrealisedPnl}})
        this.realisedPnlSeries = strategyEvents.events.map(e => { return {time:e.time, value:e.realisedPnl}})

    }



    render(){

        const {offset} = this.props


        const candles = this.candles.slice(Math.max(0, offset-30), offset)

        
        if(candles.length===0)
        return <div>No data</div>
        
        const currentCandle = candles[candles.length-1]
        const evt = this.strategyEvents.eventsMap[currentCandle.time]

        const buyLevels = evt.trades.filter(t => t.side===1).map(t => { return {qty:t.qty, price: t.price}})
        const sellLevels = evt.trades.filter(t => t.side===-1).map(t => { return {qty: t.qty, price: t.price}})

        // console.log('offset', offset, 'position', this.candles[offset].time)

        const chartPosition = this.candles[offset].time
        return (
                <Row className="show-grid">
                    <Col xs={12} md={6}>
                        <Card>
                            <Card.Body>
                                <Card.Title style={{fontSize:'1.5em'}}>Prices chart</Card.Title>
                                <Card.Subtitle className="mb-2 text-muted">EUR_USD</Card.Subtitle>
                                {/* <Card.Text> */}
                                    <CandleChart height={this.height} width={this.width} candles={candles} offset={offset}
                                                buyLevels={buyLevels}
                                                sellLevels={sellLevels}
                                                />
                                {/* </Card.Text> */}
                                <small>Unrealised PnL</small><br/>
                                <PnLChart width={this.width*2} height={50} position={chartPosition}
                                    series={this.unrealisedPnlSeries}
                                    updatePosition={this.props.updateOffset}
                                    />
                                    <br/>
                                <small>Realised PnL</small><br/>
                                <PnLChart width={this.width*2} height={50} position={chartPosition}
                                    updatePosition={this.props.updateOffset}
                                    series={this.realisedPnlSeries}/>
                                <small>Price chart overview</small><br/>
                                <CandleChartOverview width={this.width*2} height={50} position={chartPosition}
                                    updatePosition={this.props.updateOffset}
                                    candles={this.candles}/>
                            </Card.Body>
                        </Card>

                    </Col>
                    <Col xs={6} md={6}>
                        <Card>
                            <Card.Body>
                                <Card.Title style={{fontSize:'1.5em'}}>Statistics</Card.Title>
                                {/* <Card.Text> */}
                                    <StatsPanel stats={evt}/>  
                                {/* </Card.Text> */}
                            </Card.Body>
                        </Card>

                        <Card>
                            <Card.Body>
                                <Card.Title style={{fontSize:'1.5em'}}>Strategy internal state</Card.Title>
                                {/* <Card.Text> */}
                                    <pre style={{fontSize:'0.7em'}}>
                                        {JSON.stringify(evt.tracker, null, 2)}
                                    </pre>
                                    <pre style={{fontSize:'0.7em'}}>
                                        {JSON.stringify(evt.tradeState, null, 2)}
                                    </pre>
                                {/* </Card.Text> */}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

        )
    }


}

export {BacktestReplay, BacktestStrategyEventsSource, RandomTradeEventsSource};



