
import React from 'react'



class PnLChart extends React.Component {


    constructor(props){
        super(props)
        this.height = this.props.height || 50
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
        const values = this.series.map(x => x.value)
        const min = Math.min(...values)
        const max = Math.max(...values)
        let scale = Math.max(Math.abs(min), Math.abs(max))
        if(scale==0) scale = 1

        // console.log(min, max, scale, this.height)

        const translate = x => this.height/2 - x/scale * this.height/2

        c.lineWidth = 1;
        // console.log('updateCanvas', this.position)
        for(let i in this.series){
            const {time, value} = this.series[i]
            // console.log(i, this.series[i])
            if(time === this.position)
                c.strokeStyle = this.markColor
            else if(value>0)
                c.strokeStyle = this.profitColor
            else if(value<0)
                c.strokeStyle = this.lossColor
            else
                c.strokeStyle = this.neutralColor
            c.beginPath();
            c.moveTo(i,0);
            c.lineTo(i,this.height);
            // c.closePath();
            // c.fill();
            c.stroke();

            if(value>0)
                c.strokeStyle = this.profitLineColor
            else if(value<0)
                c.strokeStyle = this.lossLineColor
            else
                c.strokeStyle = this.neutralLineColor
            c.beginPath()
            const y = translate(value)
            // console.log(value, y)
            c.moveTo(i-1,y)
            c.lineTo(i,y)
            c.stroke()
        }
    }

    onClick(e){
        var rect = e.target.getBoundingClientRect();
        var x = e.clientX - rect.left
        this.updatePosition(x*2)
    }

    render(props){
        const {series, position} = this.props
        this.position = position
        this.series = series
        const halfWidth = (this.width/2)+'px'
        const halfHeight = (this.height/2)+'px'
        return (
            <canvas ref="canvas" style={{width:halfWidth, height:halfHeight}} width={this.width} height={this.height}
                onClick={this.onClick} /> 
        )

    }
}

export default PnLChart;

