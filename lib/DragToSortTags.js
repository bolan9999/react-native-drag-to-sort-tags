/*
 *
 * Created by Stone
 * https://github.com/bolan9999
 * Email: shanshang130@gmail.com
 * Date: 2018/6/10
 *
 */

import React from "react";
import {
  StyleSheet,
  Animated,
  Vibration,
  Platform,
  ViewPropTypes,
  PixelRatio
} from "react-native";

import {
  GestureHandlerGestureEvent,
  LongPressGestureHandler,
  PanGestureHandler,
  PanGestureHandlerStateChangeEvent,
  State,
  BaseButton
} from "react-native-gesture-handler";

const Button = Animated.createAnimatedComponent(BaseButton);

interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Transform {
  x: Animated.Value;
  y: Animated.Value;
}

export class DragToSortTags extends React.Component<PropType, StateType> {
  _offsetX = new Animated.Value(0);
  _offsetY = new Animated.Value(0);
  _frame: Frame;
  _tagFrames: Frame[] = [];
  _tagTransform: Transform[];
  _event;
  _panRef = React.createRef();
  _longPressRef: [];
  _tagRefs: [] = [];
  _exchangeIndex = -1;
  _animatations;
  _lastTick: number;
  _tags: string[];
  _selectedTags: string[];

  getSortedTags(): string[] {
    return this._tags;
  }

  getSelectedTags(): string[] {
    return this._selectedTags;
  }

  constructor(props: PropType) {
    super(props);
    this._selectedTags = [...props.initSelectedTags];
    this.state = { draggedIndex: -1 };
    this.componentWillReceiveProps(props);
    this._event = Animated.event(
      [
        {
          nativeEvent: {
            translationX: this._offsetX,
            translationY: this._offsetY
          }
        }
      ],
      {
        useNativeDriver: true,
        listener: this._panListener
      }
    );
  }

  static defaultProps = {
    tags: [],
    marginHorizontal: 5,
    marginVertical: 5,
    renderTag: () => null,
    colorForSelected: "red",
    opacityForDragged: 0.6,
    onTagsSorted: () => null,
    fixBorderRadiusOnAndroid: true,
    selectable: true,
    onSelectChange: () => null,
    maxCountSelectable: 0,
    vibration: 40,
    initSelectedTags: [],
    longPressResponseTime: 500
  };

  componentWillReceiveProps(next: PropType) {
    if (next.tags !== this.props.tags || !this._longPressRef) {
      this._longPressRef = [];
      this._tagTransform = [];
      this._tags = [...next.tags];
      next.tags.forEach((tag, index) => {
        this._longPressRef[index] = React.createRef();
        this._tagTransform[index] = {
          x: new Animated.Value(0),
          y: new Animated.Value(0)
        };
      });
    }
  }

  render() {
    const container = StyleSheet.flatten([this.props.style, styles.container]);
    return (
      <PanGestureHandler
        ref={this._panRef}
        simultaneousHandlers={this._longPressRef}
        onGestureEvent={this._event}
        onHandlerStateChange={this._onPanStateChange}
      >
        <Animated.View style={container} onLayout={this._onContainerLayout}>
          {this._tags.map(this._renderTags)}
        </Animated.View>
      </PanGestureHandler>
    );
  }

  _renderTags = (tag: string, index: number) => {
    const tagElement = this.props.renderTag(tag);
    if (!tagElement) return null;
    const {
      fixBorderRadiusOnAndroid,
      colorForSelected,
      opacityForDragged,
      marginHorizontal,
      marginVertical,
      longPressResponseTime
    } = this.props;
    const oldStyle = StyleSheet.flatten(tagElement.props.style);
    const dragged = this.state.draggedIndex === index;
    let borderRadius = oldStyle ? oldStyle.borderRadius : null;
    if (
      Platform.OS === "android" &&
      fixBorderRadiusOnAndroid &&
      borderRadius > 0
    ) {
      borderRadius = borderRadius * PixelRatio.get();
    }
    let backgroundColor = oldStyle ? oldStyle.backgroundColor : null;
    if (colorForSelected && this._selectedTags.indexOf(tag) >= 0) {
      backgroundColor = colorForSelected;
    }
    let opacity = oldStyle ? oldStyle.opacity : null;
    if (opacityForDragged && dragged) {
      opacity = opacityForDragged;
    }
    const style = {
      ...oldStyle,
      marginHorizontal: marginHorizontal,
      marginVertical: marginVertical,
      backgroundColor: backgroundColor,
      borderRadius: borderRadius,
      opacity: opacity,
      zIndex: dragged ? 99999999 : null,
      transform: [
        {
          translateX: dragged ? this._offsetX : this._tagTransform[index].x
        },
        {
          translateY: dragged ? this._offsetY : this._tagTransform[index].y
        }
      ]
    };
    return (
      <LongPressGestureHandler
        ref={this._longPressRef[index]}
        key={index}
        minDurationMs={longPressResponseTime}
        simultaneousHandlers={this._panRef}
        onHandlerStateChange={e => this._handleLongPress(e, index)}
      >
        <Button
          {...tagElement.props}
          style={style}
          ref={ref => (this._tagRefs[index] = ref)}
          onLayout={e =>
            (this._tagFrames[index] = Object.assign({}, e.nativeEvent.layout))
          }
          onPress={() => this._onPress(index)}
        />
      </LongPressGestureHandler>
    );
  };

  _onPanStateChange = (e: PanGestureHandlerStateChangeEvent) => {
    switch (e.nativeEvent.state) {
      case State.END:
      case State.CANCELLED:
      case State.FAILED:
        if (this._exchangeIndex === -1)
          return this._clearAllTransformAndUpdate();
        const x =
          this._tagFrames[this._exchangeIndex].x -
          this._tagFrames[this.state.draggedIndex].x;
        const y =
          this._tagFrames[this._exchangeIndex].y -
          this._tagFrames[this.state.draggedIndex].y;
        Animated.parallel([
          Animated.timing(this._offsetX, {
            toValue: x,
            duration: 100,
            useNativeDriver: true
          }),
          Animated.timing(this._offsetY, {
            toValue: y,
            duration: 100,
            useNativeDriver: true
          })
        ]).start(this._clearAllTransformAndUpdate);
    }
  };

  _handleLongPress = (e: GestureHandlerGestureEvent, index: number) => {
    const { vibration } = this.props;
    switch (e.nativeEvent.state) {
      case State.ACTIVE:
        if (vibration > 0) Vibration.vibrate(vibration, false);
        this.setState({ draggedIndex: index });
        break;
    }
  };

  _clearAllTransformAndUpdate = () => {
    this._offsetX.setValue(0);
    this._offsetY.setValue(0);
    this._tagTransform.forEach((tran: Transform) => {
      tran.x.setValue(0);
      tran.y.setValue(0);
    });
    const { draggedIndex } = this.state;
    if (
      draggedIndex !== -1 &&
      this._exchangeIndex !== -1 &&
      draggedIndex !== this._exchangeIndex
    ) {
      const tag = this._tags[draggedIndex];
      this._tags.splice(draggedIndex, 1);
      this._tags.splice(this._exchangeIndex, 0, tag);
      this.props.onTagsSorted(this._tags);
      this._autoSortSelectedTags();
    }
    this.setState({ draggedIndex: -1 });
    this._exchangeIndex = -1;
  };

  _panListener = (e: { nativeEvent: { x: number, y: number } }) => {
    const draggedIndex = this.state.draggedIndex;
    if (draggedIndex === -1) return;
    const gesture = e.nativeEvent;
    this._tagFrames.every((frame, index) => {
      const frames = this._tagFrames[index];
      if (
        gesture.x > frames.x &&
        gesture.x < frames.x + frames.width &&
        gesture.y > frames.y &&
        gesture.y < frames.y + frames.height
      ) {
        this._exchangeToIndex(draggedIndex, index);
        return false;
      }
      return true;
    });
  };

  _exchangeToIndex(draggedIndex: number, toIndex: number) {
    const now = new Date().getTime();
    const { marginHorizontal, marginVertical } = this.props;
    if (Platform.OS === "android" && now - this._lastTick < 50) {
      return;
    }
    this._lastTick = now;
    if (this._exchangeIndex !== toIndex) {
      if (this._animatations) {
        this._animatations.stop();
      }
      this._exchangeIndex = toIndex;
      const realFrames: (Frame & { offsetX?: number, offsetY?: number })[] = [];
      this._tagFrames.forEach(
        (frame, index) => (realFrames[index] = { ...frame })
      );
      realFrames[draggedIndex].width = -marginHorizontal * 2;
      realFrames.forEach((frame, index) => {
        if (index > draggedIndex) {
          realFrames[index].x =
            realFrames[index - 1].x +
            realFrames[index - 1].width +
            2 * marginHorizontal;
          realFrames[index].y = realFrames[index - 1].y;
          if (
            realFrames[index].x + realFrames[index].width + marginHorizontal >
            this._frame.width
          ) {
            realFrames[index].x = marginHorizontal;
            realFrames[index].y =
              realFrames[index - 1].y +
              realFrames[index - 1].height +
              marginVertical * 2;
          }
        }
      });
      realFrames.forEach((frame, index) => {
        if (
          (draggedIndex > toIndex && index >= toIndex) ||
          (draggedIndex <= toIndex && index > toIndex)
        ) {
          realFrames[index].x +=
            this._tagFrames[draggedIndex].width + 2 * marginHorizontal;
          if (
            realFrames[index].x + realFrames[index].width + marginHorizontal >
            this._frame.width
          ) {
            realFrames[index].x = marginHorizontal;
            realFrames[index].y +=
              realFrames[index].height + marginVertical * 2;
          }
        }
      });
      realFrames.forEach((frame, index) => {
        realFrames[index].offsetX =
          realFrames[index].x - this._tagFrames[index].x;
        realFrames[index].offsetY =
          realFrames[index].y - this._tagFrames[index].y;
      });
      const animatations = realFrames
        .map((frame, index) =>
          Animated.timing(this._tagTransform[index].x, {
            toValue: frame.offsetX,
            duration: 100,
            useNativeDriver: true
          })
        )
        .concat(
          realFrames.map((frame, index) =>
            Animated.timing(this._tagTransform[index].y, {
              toValue: frame.offsetY,
              duration: 100,
              useNativeDriver: true
            })
          )
        );
      this._animatations = Animated.parallel(animatations);
      this._animatations.start();
    }
  }

  _onContainerLayout = (e: { nativeEvent: { layout: Frame } }) => {
    this._frame = Object.assign({}, e.nativeEvent.layout);
  };

  _onPress(index: number) {
    if (!this.props.selectable) return;
    const tag = this._tags[index];
    const indexOf = this._selectedTags.indexOf(tag);
    if (
      indexOf < 0 &&
      this.props.maxCountSelectable > 0 &&
      this._selectedTags.length >= this.props.maxCountSelectable
    )
      return;

    if (indexOf < 0) {
      this._selectedTags.push(tag);
      this.forceUpdate();
      if(!this._autoSortSelectedTags()){
        this.props.onSelectChange(this._selectedTags);
      }
    } else {
      this._selectedTags.splice(indexOf, 1);
      this.forceUpdate();
      this.props.onSelectChange(this._selectedTags);
    }

  }

  _autoSortSelectedTags() {
    const sortedTags = [];
    this._tags.forEach(tag => {
      if (this._selectedTags.indexOf(tag) >= 0) sortedTags.push(tag);
    });
    if (!this._selectedTags.every((tag, index) => sortedTags[index] === tag)) {
      this._selectedTags = sortedTags;
      this.props.onSelectChange(this._selectedTags);
      return true;
    }
    return false;
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap"
  }
});

interface PropType extends ViewPropTypes {
  tags: string[];
  marginHorizontal?: number;
  marginVertical?: number;
  renderTag: (tag: string) => React.Element<View>;
  colorForSelected?: string;
  opacityForDragged?: number;
  onTagsSorted?: (tags: string[]) => any;
  fixBorderRadiusOnAndroid?: boolean;
  selectable?: boolean;
  onSelectChange?: (selectedTags: string[]) => any;
  maxCountSelectable?: number;
  vibration?: number;
  initSelectedTags?: string[];
  longPressResponseTime?: number;
}

interface StateType {
  draggedIndex: number;
}
