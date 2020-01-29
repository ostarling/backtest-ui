import React from 'react'
import './App.css'
// import hist from './hist-M5.json'
// import hist from './EUR_USD-M1-2019-07-15.json'
import hist from './EUR_USD-M1-2019-12-31.json'

import {BacktestReplay, RandomTradeEventsSource, BacktestStrategyEventsSource} from './BacktestReplay'

import Button from 'react-bootstrap/Button';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Container from 'react-bootstrap/Container';
import InputGroup from 'react-bootstrap/InputGroup';
// import FormControl from 'react-bootstrap/Container';

// import CandleChartDemo from './CandleChartDemo.js'
// class App0 extends React.Component {
//   render(){ return <CandleChartDemo/> }
// }

// import 'bootstrap/dist/css/bootstrap.min.css';


class App extends React.Component {

  constructor(props){
    super(props)
    this.state = { offset: 20, timeout: 600, delta:1 }
    this.running = true
    this.addTimeout = this.addTimeout.bind(this)
    this.pause = this.pause.bind(this)
    this.speedUp = this.speedUp.bind(this)
    this.slowDown = this.slowDown.bind(this)
    this.forward = this.forward.bind(this)
    this.backward = this.backward.bind(this)
    this.updateOffset = this.updateOffset.bind(this)
  
    const candlesRaw = hist.candles//.slice(0, 50)

    this.candles = candlesRaw.map(c => { 
      return {
        time: c.time, 
        open: Number(c.mid.o), 
        close: Number(c.mid.c), 
        high: Number(c.mid.h), 
        low: Number(c.mid.l)
      }
    })


    const tradeEventSource = new RandomTradeEventsSource(500)
    this.strategyEventsSource = new BacktestStrategyEventsSource(
      this.candles, tradeEventSource, 100, 30, 1.0, 0
    )

  
    this.strategyEventsSource.compute()

    this.strategyEvents = this.strategyEventsSource.eventsMap

  }

  updateOffset(offset){
    this.setState(
      {offset: offset}
    )
  }

  step(deltaParam){
    const delta = deltaParam || this.state.delta
    const newOffset = this.state.offset+delta 
    if( newOffset>=0 && newOffset < this.candles.length){
      this.setState({
        offset: this.state.offset + delta
      })
    }
  }

  addTimeout(){
    setTimeout(() => {
      this.step()
      if(this.running){
        this.addTimeout()
      }
    }, this.state.timeout);
  }

  speedUp(){
    this.setState({
      timeout: this.state.timeout/2
    })
  }
  slowDown(){
    this.setState({
      timeout: this.state.timeout*2
    })
  }
  forward(){
    this.setState({
      delta: 1
    })
  }
  backward(){
    this.setState({
      delta: -1
    })
  }

  pause(){
    this.running = !this.running
    if(this.running){
      this.addTimeout()
    }
  }

  componentDidMount(){
    this.addTimeout()
  }

  render(){

    return (
        <Container fluid="md">
          <h2>Backtesting visualisation for {hist.instrument}</h2>
          <InputGroup className="mb-3"  >
            <InputGroup.Prepend>
              <InputGroup.Text id="basic-addon3" className="playbackControl">
                Playback control
              </InputGroup.Text>
            </InputGroup.Prepend>
            <InputGroup.Append>
              <Button className="playbackControl" size="sm" variant="outline-info" onClick={() => this.step(-1)}>&lt; -1</Button>
              <Button className="playbackControl" size="sm" variant="outline-info" onClick={this.pause}>pause/resume</Button>
              <Button className="playbackControl" size="sm" variant="outline-info" onClick={() => this.step(1)}>+1 &gt;</Button>
              <Button className="playbackControl" size="sm" variant="outline-info" onClick={this.speedUp}>faster</Button>
              <Button className="playbackControl" size="sm" variant="outline-info" onClick={this.slowDown}>slower</Button>
              {/* <Button size="sm" variant="outline-info" onClick={this.backward}>&lt;&lt; go back</Button>
              <Button size="sm" variant="outline-info" onClick={this.forward}>go forward &gt;&gt;</Button> */}
            </InputGroup.Append>
            <InputGroup.Prepend>
              <InputGroup.Text id="basic-addon3" className="playbackControl">
                Direction
              </InputGroup.Text>
            </InputGroup.Prepend>
            <InputGroup.Append>
              <Button className="playbackControl" size="sm" variant="outline-info" onClick={this.backward}>&lt;&lt; backward</Button>
              <Button className="playbackControl" size="sm" variant="outline-info" onClick={this.forward}>forward &gt;&gt;</Button>
            </InputGroup.Append>
          </InputGroup>

          <InputGroup className="mb-3">
          </InputGroup>

          <BacktestReplay 
            strategyEvents={this.strategyEventsSource}
            candles={this.candles} 
            offset={this.state.offset}
            updateOffset={this.updateOffset}
            height={400} width={600} 
            />

        </Container>
    )
  }
}

export default App;
