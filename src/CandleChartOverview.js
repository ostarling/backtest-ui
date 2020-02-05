
import React from 'react'



class CandleChartOverview extends React.Component {


    constructor(props){
        super(props)
        this.height = this.props.height || 100
        this.width = this.props.width || 640
        this.lossColor = this.props.lossColor || "#ffcccc"
        this.profitColor = this.props.profitColor || "#ccffcc"
        this.neutralColor = this.props.neutralColor || "white"
        this.lossLineColor = this.props.lossLineColor || "#880000"
        this.profitLineColor = this.props.profitLineColor || "#008800"
        this.neutralLineColor = this.props.neutralLineColor || "black"
        this.markColor = this.props.markColor || "black"
        this.onClick = this.onClick.bind(this)
        this.updatePosition = this.props.updatePosition || (()=>{})
    }


    componentDidMount() {
        this.updateCanvas()
    }
    componentDidUpdate() {
        this.updateCanvas()
    }
    updateCanvas(){
        const c = this.refs.canvas.getContext('2d');
        // c.fillStyle = "red"; 
        // c.fillRect(0,0,640,40);
        // 60*24
        const highs = this.candles.map(x => x.high)
        const lows = this.candles.map(x => x.low)
        const min = Math.min(...lows)
        const max = Math.max(...highs)
        let scale = max-min
        if(scale==0) scale = 1

        // console.log(min, max, scale, this.height)

        const translate = x => this.height - (x-min)/scale * this.height

        c.lineWidth = 1;
        let positionIndex = 0
        // console.log('updateCanvas', this.position)
        for(let i in this.candles){
            const candle = this.candles[i]
            // console.log(i, this.series[i])
            if(candle.time === this.position)
                c.strokeStyle = this.markColor
            else if(candle.close-candle.open >=0)
                c.strokeStyle = this.profitColor
            else
                c.strokeStyle = this.lossColor
            c.beginPath();
            c.moveTo(i,0);
            c.lineTo(i,this.height);
            c.stroke();

            if(candle.close-candle.open >= 0)
                c.strokeStyle = this.profitLineColor
            else 
                c.strokeStyle = this.lossLineColor
            c.beginPath()
            // console.log(value, y)
            c.moveTo(i,translate(candle.low))
            c.lineTo(i,translate(candle.high))
            c.stroke()
        }


    }

    onClick(e){
        var rect = e.target.getBoundingClientRect();
        var x = e.clientX - rect.left
        this.updatePosition(Math.round(x/this.width*this.candles.length))
    }

    render(props){
        const {candles, position} = this.props
        this.position = position
        this.candles = candles
        // const halfWidth = (this.width/2)+'px'
        // const halfHeight = (this.height/2)+'px'
        return (
            <canvas ref="canvas" style={{width:this.width, height:this.height}} width={this.candles.length} height={this.height*2}
                onClick={this.onClick} /> 
        )

    }
}

export default CandleChartOverview;

