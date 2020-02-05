import React from 'react';

import Fade from 'react-bootstrap/Fade';
import Table from 'react-bootstrap/Table';


const FormatPnl = (value) => { return <span className={value && value <0 ? "loss" : "profit" }>{value.toFixed(5)}</span> }
const FormatPips = (value) => { return <span className={value && value <0 ? "loss" : "profit" }>{value.toFixed(1)}</span> }
const FormatMoney = (value) => { return <span className={value && value <0 ? "loss" : "profit" }>{value.toFixed(5)}</span> }


class StatsPanel extends React.Component {

    // position - open/close
    // balance
    // realisedPnl
    // unrealisedPnl
    // marginUsed
    // maxDrawDown
    // numTrades

    render(){

        const {stats} = this.props
        const hasPositions = (stats.trades || []).length > 0 

        return (
            <div style={{fontSize:'12px'}}>
                <table>
                    <tbody>
                    <tr>
                        <th width="100">Balance</th>
                        <td>{FormatPnl(stats.balance)}</td>
                    </tr>
                    <tr>
                        <th>Realised PnL</th>
                        <td>{FormatPnl(stats.realisedPnl)}</td>
                    </tr>
                    <tr>
                        <th>Unrealised PnL</th>
                        <td>{FormatPnl(stats.unrealisedPnl)}</td>
                    </tr>
                    <tr>
                        <th>Margin Used</th>
                        <td>{FormatMoney(stats.marginUsed)}</td>
                    </tr>
                    <tr>
                        <th>Net Asset Value</th>
                        <td>{FormatPnl(stats.netAssetValue)}</td>
                    </tr>
                    <tr>
                        <th>Max Drawdown</th>
                        <td>{FormatPnl(stats.maxDrawdown)}</td>
                    </tr>
                    <tr>
                        <th>Current price</th>
                        <td>{stats.price}</td>
                    </tr>
                    <tr>
                        <td colSpan="2">
                            <h6>Positions</h6>
                            <p>
                              {stats.trades.map((pos, index) => {
                                                        return (
                                                            <span key={index}>
                                        {pos.side>0 ? "BUY" : "SELL"} {pos.instr}: {pos.qty} @{pos.price.toFixed(5)}, PnL: {FormatPnl(pos.pnl)}, pips: {FormatPips(pos.pips)}
                                    </span>)
                            })}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan="2">
                            <h6>Log</h6>
                            <Table striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Order</th>
                                        <th>Side</th>
                                        <th>Qty</th>
                                        <th>Instr</th>
                                        <th>Price</th>
                                        <th>Trade PnL</th>
                                        <th>Pips</th>
                                        <th>Total PnL</th>
                                    </tr>
                                </thead>
                                <tbody>

                            {stats.log.map((l,index) => {
                                return (
                                    <tr key={index}>
                                        <td><a onClick={() => this.props.updateTimeOffset(l.time)}>{l.time.substr(0, "2019-12-31T05:45".length)}</a></td>
                                        <td>{l.type}</td> 
                                        <td>{l.side>0 ? "BUY" : "SELL"}</td> 
                                        <td>{l.qty}</td> 
                                        <td>{l.instr}</td> 
                                        <td>{l.price.toFixed(5)}</td> 
                                        <td>{l.pnl && FormatPnl(l.pnl)}</td>
                                        <td>{l.pips && FormatPips(l.pips)}</td>
                                        <td>{l.totalPnl && FormatPnl(l.totalPnl)}</td>
                                    </tr>
                                    )
                                })}
                                </tbody>
                            </Table>
                        </td>
                    </tr>
                    </tbody>
                </table>

            </div>   
        )
    }
}

export {StatsPanel as default}
