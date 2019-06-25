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
            foundBox:{},
            calculating:false
        }
    }

    componentDidMount(){
        this.getCanvasImages();
        this.updateLeftCanvas();
        this.updateRightCanvas();
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
        if(this.state.selectionBox.x && this.state.selectionBox.width){
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

    async onClickCanvas1(evt){
        if(!this.state.calculating){
            this.setState({
                calculating:true
            });
            //this.drawArrayToCanvas(this.get2dArraySection(this.props.images[0].arr.data, this.state.selectionBox), document.getElementById("debugCanvas"))
            
            let matchMap = await this.calculateMatchMap(this.get2dArraySection(this.props.images[0].arr.data, this.state.selectionBox), this.props.images[1].arr.data);
            let minIndex = this.getMinColorIndex(matchMap);

            console.log(matchMap);
            console.log(minIndex);

            this.setState({
                foundBox: {
                    x: minIndex[1],
                    y: minIndex[0],
                    width: this.state.selectionBox.width,
                    height: this.state.selectionBox.height
                }
            });

            this.drawArrayToCanvas(matchMap, document.getElementById("debugCanvas"));

            this.setState({
                calculating:false
            })
        }
    }

    getMinColorIndex(arr){
        let min = Infinity;
        let cords = [];
        for(let i = 0; i < arr.length; i++){
            for (let j = 0; j < arr[i].length; j++){
                let sum = arr[i][j].reduce((a, b) => a + b, 0);
                if (min > sum){
                    min = sum;
                    cords[0] = i;
                    cords[1] = j;
                }
            }

        }
        return cords;
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
        return new Promise((resolve, reject) => {
            let out = [];
            for (let i = 0; i < img.length; i++) {
                out[i] = [];
                let percentage = (i / img.length) * 100;
                if (percentage % 10 < 2 ){
                    console.log(percentage);
                }
                for (let j = 0; j < img[i].length; j++) {
                    out[i][j] = [0,0,0,0];



                    if (i < img.length - section.length && j < img[i].length - section[0].length){
                        for (let is = 0; is < section.length; is++) {
                            for (let js = 0; js < section[0].length; js++) {
                                let x = j+js;
                                let y = i+is;
                                let pixelSum = section[is][js].map((el, i) => Math.abs(el - img[y][x][i]));
                                pixelSum[3] = 255;

                                out[i][j] = out[i][j].map((el, i) => el + pixelSum[i]);
                            }
                        }
                        out[i][j] = out[i][j].map((el) => (el / (section.length * section[0].length)));
                    }else{
                        out[i][j] = [255, 255, 255, 255];
                    }

                }
            }
            resolve(out);
        });
    }

    updateRightCanvas(){
        var ctx = document.getElementById('canvas2').getContext('2d');
        ctx.imageSmoothingEnabled = false;
        if (this.state.foundBox.x && this.state.foundBox.width) {
            ctx.clearRect(0, 0, document.getElementById('canvas2').width, document.getElementById('canvas2').height);
            ctx.drawImage(this.state.canvasImages[1], 0, 0);
            ctx.beginPath();
            ctx.rect(this.state.foundBox.x, this.state.foundBox.y, this.state.foundBox.width, this.state.selectionBox.height);
            ctx.stroke();
            ctx.closePath();
        } else {
            if (this.state.canvasImages.length > 0)
                ctx.drawImage(this.state.canvasImages[1], 0, 0);
        }
    }

    calcLeftRect(evt){
        if (!this.state.calculating){
            evt.persist();
            let rect = document.getElementById('canvas1').getBoundingClientRect();
            this.setState((prevState) => {
                let selectionBox = Object.assign({}, prevState.selectionBox);
                selectionBox.width = 20;
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
                <canvas width={this.props.images[1].arr.width} height={this.props.images[1].arr.height} id="canvas2"></canvas>
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