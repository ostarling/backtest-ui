import React from 'react';
import hist from './hist-M5.json';
import CandleChart from './CandleChart.js'



class CandleChartDemo extends React.Component {

  constructor(props){
    super(props)
    this.state = { offset: 1 }
    this.step = this.step.bind(this)
    this.addTimeout = this.addTimeout.bind(this)
    
    this.candles = hist.candles.map(c => { 
      return {
        time: c.time, 
        open: Number(c.mid.o), 
        close: Number(c.mid.c), 
        high: Number(c.mid.h), 
        low: Number(c.mid.l)
      }
    })
  }

  step(){
    if(this.state.offset < hist.candles.length){
      this.setState({
        offset: this.state.offset + 1
      })
    }
  }

  addTimeout(){
    setTimeout(() => {
      this.step()
      this.addTimeout()
    }, 600);
  }

  componentDidMount(){
    this.addTimeout()
  }

  render(){

    const displayCandles = this.candles.slice(Math.max(0, this.state.offset - 20), this.state.offset)

    return (
      <div className="App">
        <p>{hist.instrument}</p>

        
        {/* <button type="button" onClick={this.step}>Step</button> */}

        <CandleChart height={400} width={600} candles={displayCandles} offset={this.state.offset}/>

        {/* { candles.map((c,index) => {
            return <p key={index}>{JSON.stringify(c)}</p>
        })
        } */}

      </div>
    )
  }
}

export default CandleChartDemo;
