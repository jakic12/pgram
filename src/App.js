import React, {Component} from 'react';
import './App.scss';
import Paper from '@material-ui/core/Paper';

import Processor from './components/Processor.jsx';
import Dragndrop from './components/Dragndrop.jsx';

class App extends Component {
  constructor(props){
    super(props);

    this.state = {
      images:[]
    }
  }
  render(){
    return (
      <div className="App">
        <Paper className="dragNdrop">
          <Dragndrop imageCallBack={images => {
            this.setState({images});
          }}/>
        </Paper>

        {(()=>{
          if(this.state.images.length > 0){
            console.log(this.state)
            return (
              <Paper className="processorContainer">
                <Processor images={this.state.images} />
              </Paper>
            );
          }
        })()}
      </div>
    );
  }
}

export default App;
