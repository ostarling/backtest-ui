
import React from 'react';

class CandleChart extends React.Component {

    render(){
        const {height, width, candles, buyLevels, sellLevels, showCandleChange} = this.props
  

        if(candles.length === 0)
            return <div>No candles§</div>

        const vpWidth = 600
        const vpHeight = 400
        const bottomLabelsHight = 30
        const rightPricesWidth = 50
        const padding = 15
        const chartPadding = { 
            left: padding+12, 
            top: padding, 
            bottom: padding+bottomLabelsHight, 
            right: padding+rightPricesWidth-8,
            h: () => chartPadding.top + chartPadding.bottom,
            w: () => chartPadding.left + chartPadding.right
        }
  

        const candlesForDisplay = candles//.slice(offset, offset+candlesCount)
        const candlesCount = candles.length//(candleSpaceWidth - candlePadding) / (candleWidth + candlePadding)
        const levels = buyLevels.concat(sellLevels).map(l => l.price)
        const min = candlesForDisplay.map(x=> x.low).concat(levels).reduce((a,b)=>Math.min(a,b))
        const max = candlesForDisplay.map(x=> x.high).concat(levels).reduce((a,b)=>Math.max(a,b))

        const vertLayout = {
            min: min,
            max: max,
            priceRange: max-min,
            top: chartPadding.top,
            bottom: vpHeight - chartPadding.bottom,
            ratio: (vpHeight-(chartPadding.h()))/ (max-min)
        }

    
        const horLayout = {
            left: chartPadding.left,
            right: vpWidth - chartPadding.right,
        }

        // const candleSpaceWidth = vpWidth - chartPadding.w()
        const spacePerCandle = (vpWidth - chartPadding.w()) / candlesCount//vpWidth - chartPadding.w()
        const candleWidth = Math.min(spacePerCandle * 2 / 3, 40)//10
        const candlePadding= Math.min(spacePerCandle - candleWidth, 15) //5
  
        const translate = price => { return vertLayout.top + (vertLayout.max-price) * vertLayout.ratio }
  
        const drawCandle = (c, offset, showChange) => {
            // const colour = c.close>c.open ? "#00d300" : "#d30000"
            // const colourBorder = c.close>c.open ? "#008300" : "#830000"
            const candleClass = c.close>=c.open ? "greenCandle" : "redCandle"
            
            const high = translate(c.high)
            const low = translate(c.low)
            const left = offset
            const right = offset+candleWidth-1
            const centre = offset+candleWidth/2
            const boxWidth = candleWidth-2

            const boxTop = translate(Math.max(c.open, c.close))
            const boxBottom = translate(Math.min(c.open, c.close))
            const boxHeight = Math.max(1, translate(Math.min(c.open, c.close))- boxTop - 1)
            const needsFill = boxTop > boxBottom+1
            const justALine = boxTop === boxBottom

    
            return (
            <React.Fragment key={c.time}>
                { justALine && 
                    <path d={`M ${left} ${boxTop} L ${right} ${boxTop} `} className={candleClass} />
                }
                { !justALine &&
                    <path d={`M ${right} ${boxTop} L ${right} ${boxBottom} L ${left} ${boxBottom} L ${left} ${boxTop}`}
                        className={candleClass}/>
                }

                <path d={`M ${centre} ${high} L ${centre} ${boxTop} `} className={candleClass} />
                <path d={`M ${centre} ${boxBottom} L ${centre} ${low} `} className={candleClass} />
                {showChange && 
                    <text x={offset+candleWidth/2} y={translate((c.open+c.close)/2)} textAnchor="middle" 
                        className="chartCandleDiff">{Math.round(Math.abs(c.open-c.close)*10000)}</text>
                }
            </React.Fragment>
            )
        }
  
  
        const candlesSvg = candlesForDisplay.map( (c, index) => {
            return drawCandle(c, chartPadding.left + (candleWidth + candlePadding)*index, showCandleChange)
        })
  
  
        const lastCandle = candlesForDisplay[candlesForDisplay.length - 1]
    
        const priceLabelCount = 20
        const priceLabelMin = Number(vertLayout.min.toFixed(5))
        const priceLabelStep =  Math.max(0.00005, Number((vertLayout.priceRange/(priceLabelCount-1)).toFixed(5)))
        const priceLabelCountAdjusted = Math.ceil(vertLayout.priceRange / priceLabelStep)
        // console.log("priceLabelCountAdjusted", priceLabelCountAdjusted, priceLabelMin, priceLabelStep, vertLayout)
        const priceLabels = 
            Array(priceLabelCountAdjusted).fill().map((_,index) => {
            const price = priceLabelMin + priceLabelStep * index
            const y = translate(price)
            return (
            <React.Fragment key={index}>
                <text x={vpWidth-chartPadding.right} 
                y={y+3} 
                className="chartPriceLabel">{price.toFixed(5)}</text>
                <path d={`M ${horLayout.left} ${y} L ${horLayout.right} ${y} `} className="chartHorLine" />
            </React.Fragment>
            )
            })
        
        const candlesWithTime = candlesForDisplay.map((c,index)=>{return {c:c, index:index}}).filter((c, index) => index % 4 === 0)
        const timeLabels = 
        candlesWithTime.map( cnd => {
            const {c, index} = cnd
            const x = chartPadding.left + candlePadding + index*(candleWidth+candlePadding) + candleWidth/2
            return (
            <React.Fragment key={index}>
                <text x={x} 
                    y={vpHeight-chartPadding.bottom+12} 
                    textAnchor="middle"
                    className="chartTimeLabel">{c.time.slice(11,16)}</text>
                <path d={`M ${x} ${vertLayout.top} L ${x} ${vertLayout.bottom} `} className="chartVertLine" />
            </React.Fragment>
            )
        })
        const dateLabels = [candlesWithTime[0], candlesWithTime[candlesWithTime.length-1]].map(cnd => {
            const {c, index} = cnd
            const x = chartPadding.left + candlePadding + index*(candleWidth+candlePadding) + candleWidth/2
            return (
                    <text x={x} key={index}
                        y={vpHeight-chartPadding.bottom+24} 
                        textAnchor="middle"
                        className="chartTimeLabel">{c.time.slice(0,10)}</text>
            )  
        })
    
        const displayBuyLevels = (buyLevels || []).filter(l => l.price>=vertLayout.min && l.price<=vertLayout.max)
        const displaySellLevels = (sellLevels || []).filter(l => l.price>=vertLayout.min && l.price<=vertLayout.max)

        const renderLevel = (l, index,lineClass, textClass) => {
            const y = translate(l.price)
            return (
                <React.Fragment key={index}>
                    <path d={`M ${horLayout.left} ${y} L ${horLayout.right} ${y} `} className={lineClass} />
                    <rect x={chartPadding.left+2*spacePerCandle} y={y-7} height="12" width="90" className={lineClass}/>
                    <text x={chartPadding.left+2*spacePerCandle+3} y={y+3} className={textClass}>{l.qty}@{l.price.toFixed(5)}</text>
                </React.Fragment>
            )

        }

        const buyLevelLines = displayBuyLevels.map((l,index) => renderLevel(l, index, "buyLevelLine",  "buyLevelQty"))
        const sellLevelLines = displaySellLevels.map((l,index) => renderLevel(l, index, "sellLevelLine",  "sellLevelQty"))


        return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${vpWidth} ${vpHeight}`} width={width} height={height}>
    
            <rect x={0} y={0} 
                width={vpWidth} height={vpHeight} 
                stroke="blue" fill="transparent" strokeWidth="1">
            </rect>
    
    
            <rect x={chartPadding.left} y={chartPadding.top} 
                width={vpWidth-chartPadding.w()} height={vpHeight-chartPadding.h()} 
                stroke="#eee" fill="transparent" strokeWidth="1">
            </rect>
    
            {timeLabels}
            {dateLabels}
            {priceLabels}
    
            <rect x={vpWidth-chartPadding.right} y={translate(lastCandle.close)-7} height="12" width="50" className="charLastPriceBg"/>
            <text x={vpWidth-chartPadding.right} y={translate(lastCandle.close)+3} className="chartLastPrice">{lastCandle.close.toFixed(5)}</text>
    
            {candlesSvg}
            {buyLevelLines}     
            {sellLevelLines}     
    
        </svg>)
    }
  
}


export {CandleChart as default}
