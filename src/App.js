import React from 'react'
import './App.css'
// import hist from './hist-M5.json'
import hist from './EUR_USD-M1-2019-07-15.json'
// import hist from './EUR_USD-M1-2019-12-31.json'
// import results from './results/GBP_USD/SimpleStrategy/2019-10-01/testRun1.json'

import {BacktestReplay, RandomTradeEventsSource, BacktestStrategyEventsSource} from './BacktestReplay'

import Button from 'react-bootstrap/Button';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Container from 'react-bootstrap/Container';
import InputGroup from 'react-bootstrap/InputGroup';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Navbar from 'react-bootstrap/Navbar';

// import FormControl from 'react-bootstrap/Container';

// import CandleChartDemo from './CandleChartDemo.js'
// class App0 extends React.Component {
//   render(){ return <CandleChartDemo/> }
// }

// import 'bootstrap/dist/css/bootstrap.min.css';


class App extends React.Component {

  constructor(props){
    super(props)

    this.shift = 20

    this.state = { offset: this.shift, timeout: 600, delta:1 }
    this.running = true
    this.addTimeout = this.addTimeout.bind(this)
    this.pause = this.pause.bind(this)
    this.speedUp = this.speedUp.bind(this)
    this.slowDown = this.slowDown.bind(this)
    this.forward = this.forward.bind(this)
    this.backward = this.backward.bind(this)
    this.updateOffset = this.updateOffset.bind(this)
    this.updateTimeOffset = this.updateTimeOffset.bind(this)
    this.initilise = this.initilise.bind(this)
  
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
    this.timeToOffset = {}
    for(let i in this.candles){
      const c = this.candles[i]  // TODO buggy
      const index = i-this.shift
      if(index>=0)
        this.timeToOffset[c.time] = index
    }

    this.tradeEventSource = new RandomTradeEventsSource(500)
    this.initilise()
  }

  initilise(){

    this.strategyEventsSource = new BacktestStrategyEventsSource(
      this.candles, this.tradeEventSource, 100, 30, 1.0, 0
    )
  
    this.strategyEventsSource.compute()

    this.strategyEvents = this.strategyEventsSource.eventsMap
    this.updateOffset(20)
  }

  updateOffset(offset){
    this.setState(
      {offset: offset}
    )
  }

  updateTimeOffset(timeOffset){
    const offset = this.timeToOffset[timeOffset]
    if(typeof(offset) !== "undefined"){
      this.setState(
        {offset: offset}
      )
    }
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
          <Navbar bg="light" expand="lg" sticky="top">
            <Navbar.Brand href="#home">Backtesting visualisation for {hist.instrument}</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="mr-auto">
                <Nav.Link onClick={this.initilise}>Rerun</Nav.Link>
                <NavDropdown title="Strategy" id="basic-nav-dropdown">
                  <NavDropdown.Item href="#action/3.1">Random</NavDropdown.Item>
                  <NavDropdown.Item href="#action/3.2">Simple v1</NavDropdown.Item>
                  <NavDropdown.Item href="#action/3.3">Simple v2</NavDropdown.Item>
                </NavDropdown>
                <NavDropdown title="Instrument" id="basic-nav-dropdown">
                  <NavDropdown.Item href="#action/3.1">EUR/USD</NavDropdown.Item>
                  <NavDropdown.Item href="#action/3.2">EUR/GBP</NavDropdown.Item>
                  <NavDropdown.Item href="#action/3.3">GBP/USD</NavDropdown.Item>
                </NavDropdown>
              </Nav>
              {/* <Form inline>
                <FormControl type="text" placeholder="Search" className="mr-sm-2" />
                <Button variant="outline-success">Search</Button>
              </Form> */}
            </Navbar.Collapse>
          </Navbar>



          {/* <h2>Backtesting visualisation for {hist.instrument}</h2> */}
          <InputGroup className="mb-3"  >
            <InputGroup.Prepend>
              <InputGroup.Text id="basic-addon3" className="playbackControl">
                Playback
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
            updateTimeOffset={this.updateTimeOffset}
            height={400} width={600} 
            />

        </Container>
    )
  }
}

export default App;
