import React from 'react';
import Slider from '@material-ui/lab/Slider';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import Cropper from 'react-easy-crop';
import getCroppedImg from './cropImage';

const styles = {
    cropButton: {
        flexShrink: 0,
        marginLeft: 16
    },
    cropContainer: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 80
    },
    App: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    },
    controls: {
        bottom: 0,
        left: 0,
        width: '100%',
        padding: '0 16px',
        height: '80px',
        display: 'flex',
        alignItems: 'center'
    },
    slider: {
        padding: '22px 0px'
    }
};

export interface IEasyCropperProp {
    classes: any;
    imageSrc: any;
    saveCroppedImg: any;
}

export interface IEasyCropperState {
    crop: any;
    zoom: number;
    aspect: any;
    croppedImage: any;
    croppedAreaPixels: any;
}

// crop 할 수 있는 사이즈 고정하여 이미지를 옮기는 형태
class EasyCropper extends React.Component<IEasyCropperProp, IEasyCropperState> {

    state: IEasyCropperState = {
        crop: { x: 0, y: 0 },
        zoom: 1,
        aspect: 5 / 5,
        croppedAreaPixels: null,
        croppedImage: null
    };

    onCropChange = crop => {
        this.setState({ crop });
    };

    onCropComplete = (croppedArea, croppedAreaPixels) => {
        this.setState({ croppedAreaPixels });
    };

    onZoomChange = (e, zoom) => {
        this.setState({ zoom });
    };

    saveCroppedImage = async () => {
        const croppedImage = await getCroppedImg(
            this.props.imageSrc,
            this.state.croppedAreaPixels
        );
        this.props.saveCroppedImg(croppedImage);
    };

    handleClose = () => {
        this.setState({ croppedImage: null });
    };

    render() {
        const { classes, imageSrc } = this.props;

        return (
            <div className={ classes.App }>
                <div className={ classes.cropContainer }>
                    <Cropper
                        image={ imageSrc }
                        crop={ this.state.crop }
                        zoom={ this.state.zoom }
                        aspect={ this.state.aspect }
                        onCropChange={ this.onCropChange }
                        onCropComplete={ this.onCropComplete }
                        onZoomChange={ this.onZoomChange }
                    />
                </div>
                <div className={ classes.controls }>
                    <Slider
                        value={ this.state.zoom }
                        min={ 1 }
                        max={ 3 }
                        step={ 0.1 }
                        aria-labelledby="Zoom"
                        onChange={ this.onZoomChange }
                        className={ classes.slider }
                    />
                    <Button
                        onClick={ this.saveCroppedImage }
                        variant="contained"
                        color="primary"
                        className={ classes.cropButton }
                    >
                        등록하기
                    </Button>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(EasyCropper);
