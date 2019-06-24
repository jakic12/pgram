import React, { Component } from 'react'
import Dropzone  from 'react-dropzone';
import jpeg from 'jpeg-js';

function pFileReader(file){
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        if (file.type === "image/jpeg"){
            reader.onload = () => {resolve(reader)};
            reader.onabort = () => {reject("aborted")};
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        }else{
            reject("invalid data type");
        }
    });
}

function convertImageArray(arr){
    let width = arr.width;
    let height = arr.height;
    let data = arr.data;

    let outArr = [];
    for (let i = 0; i < height; i++){
        outArr[i] = [];
        for (let j = 0; j < width; j++){
            outArr[i][j] = data.slice(i * width * 4 + j * 4, i * width * 4 + j * 4 + 4);
        }
    }
    return { width, height, data: outArr, original: arr};
}

class MyDropzone extends Component {
    constructor(props){
        super(props);
        this.dropHandler = this.dropHandler.bind(this);
    }

    async dropHandler(acceptedFiles){
        let imageArrays = [];
        for (let i = 0; i < acceptedFiles.length; i++) {
            try {
                let reader = await pFileReader(acceptedFiles[i]);
                let data = jpeg.decode(reader.result, true);
                imageArrays.push({ raw: acceptedFiles[i], arr: convertImageArray(data)});
            } catch (err) {
                if (err === "aborted")
                    console.log("reading aborted");
                else
                    console.log(err);

            }
        }

        if (this.props.imageCallBack) {
            this.props.imageCallBack(imageArrays);
        }

    }
    
    render(){
        return (
            <Dropzone onDrop={this.dropHandler}>
                {({ getRootProps, getInputProps, isDragActive }) => (
                    <section style={{ width: "100%", height: "100%" }}>
                        <div {...getRootProps()} style={{width:"100%", height: "100%"}}>
                            <input {...getInputProps()} />
                            <p>Drag 'n' drop some files here, or click to select files</p>
                            {(() => {
                                if(isDragActive){
                                    return <p>dropmehere</p>
                                }
                            })()}
                        </div>
                    </section>
                )}
            </Dropzone>
        )
    }
}

export default MyDropzone;