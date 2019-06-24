import React, { Component } from 'react';


function error(error){
    return <div className={"error"}>{error}</div>
}

class Processor extends Component{
    constructor(props){
        super(props);

        this.getCanvasImages = this.getCanvasImages.bind(this);
        this.calcLeftRect = this.calcLeftRect.bind(this);
        this.updateLeftCanvas = this.updateLeftCanvas.bind(this);
        this.updateRightCanvas = this.updateRightCanvas.bind(this);
        this.onClickCanvas1 = this.onClickCanvas1.bind(this);
        this.state = {
            canvasImages:[],
            selectionBox:{},
            calculating:false
        }
    }

    componentDidMount(){
        this.getCanvasImages();
        this.updateLeftCanvas();
        this.updateRightCanvas();
        console.log(this.props.images[0]);
    }
    
    componentDidUpdate(){
        this.updateLeftCanvas();
        this.updateRightCanvas();
    }

    async asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }

    async getCanvasImages(){
        let canvasImages = [];
        await this.asyncForEach(this.props.images, async (el) => {
            await new Promise((resolve) => {
                var img = new Image();
                img.onload = function () {
                    canvasImages.push(img);
                    resolve();
                }
                img.src = URL.createObjectURL(el.raw);
            });
        });
        this.setState({
            canvasImages
        });
    }

    updateLeftCanvas(){
        var ctx = document.getElementById('canvas1').getContext('2d');
        ctx.imageSmoothingEnabled = false;
        if(this.state.selectionBox.x && this.state.selectionBox.x1){
            ctx.clearRect(0, 0, document.getElementById('canvas1').width, document.getElementById('canvas1').height);
            ctx.drawImage(this.state.canvasImages[0], 0, 0);
            ctx.beginPath();
            ctx.rect(this.state.selectionBox.x, this.state.selectionBox.y, this.state.selectionBox.width, this.state.selectionBox.height);
            ctx.stroke();
            ctx.closePath();
        }else{
            if(this.state.canvasImages.length > 0)
                ctx.drawImage(this.state.canvasImages[0], 0, 0);
        }
    }

    onClickCanvas1(evt){
        if(!this.state.calculating){
            this.drawArrayToCanvas(this.get2dArraySection(this.props.images[0].arr.data, this.state.selectionBox), document.getElementById("debugCanvas"))
            this.calculateMatchMap(this.get2dArraySection(this.props.images[0].arr.data, this.state.selectionBox), this.props.images[0].arr.data);
            this.setState({
                calculating:true
            });
        }
    }

    flat3dArray(arr){
        let out = [];
        for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr[i].length; j++) {
                out.push(...arr[i][j]);
            }
        }
        return out;
    }

    get2dArraySection(arr, coords){
        let rows = [];
        for (let i = parseInt(coords.y); i < parseInt(coords.y1); i++) {
            if(i >= 0 && i < arr.length){
                rows.push([...arr[i]].splice(parseInt(coords.x), parseInt(coords.width)));
            }
        }
        return rows;
    }

    drawArrayToCanvas(arr, canvas){
        let ctx = canvas.getContext("2d");
        if(arr && arr[0]){
        canvas.width = arr[0].length;
        canvas.height = arr.length;
        ctx.putImageData(new ImageData(new Uint8ClampedArray(this.flat3dArray(arr)), arr[0].length, arr.length),0,0);
        }
    }

    calculateMatchMap(section, img){
        console.log(section);
    }

    updateRightCanvas(){
        var ctx = document.getElementById('canvas2').getContext('2d');
        if (this.state.canvasImages.length > 0)
            ctx.drawImage(this.state.canvasImages[0], 0, 0);
    }

    calcLeftRect(evt){
        if (!this.state.calculating){
            evt.persist();
            let rect = document.getElementById('canvas1').getBoundingClientRect();
            this.setState((prevState) => {
                let selectionBox = Object.assign({}, prevState.selectionBox);
                selectionBox.width = 40;
                selectionBox.height = selectionBox.width;
                selectionBox.x = evt.clientX - rect.left;
                selectionBox.y = evt.clientY - rect.top;
                selectionBox.x1 = selectionBox.x + selectionBox.width;
                selectionBox.y1 = selectionBox.y + selectionBox.height;
                return { selectionBox };
            });
        }
    }

    render(){
        if(this.props.images){
            return (
            <div>
                <div>{this.props.images.length} images loaded</div>
                <canvas onClick={this.onClickCanvas1} onMouseMove={this.calcLeftRect} width={this.props.images[0].arr.width} height={this.props.images[0].arr.height} id="canvas1"></canvas>
                <canvas width={this.props.images[0].arr.width} height={this.props.images[0].arr.height} id="canvas2"></canvas>
                <canvas id="debugCanvas"></canvas>
            </div>)
        }else{
            return error("no images supplied");
        }
    }

    generate(){

    }
}

export default Processor;