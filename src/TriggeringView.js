// @flow
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, Animated } from 'react-native';
import { ScrollContext } from './ImageHeaderScrollView';

class TriggeringView extends Component {
  initialPageY = 0;
  listenerId = '';
  ref = null; // Reference to the view
  height = 0;
  prevScrollY = null;

  static contextType = ScrollContext;

  static defaultProps = {
    onBeginHidden: () => {},
    onHide: () => {},
    onBeginDisplayed: () => {},
    onDisplay: () => {},
    onTouchTop: () => {},
    onTouchBottom: () => {},
    bottomOffset: 0,
    topOffset: 0,
  };

  state = {
    touched: false,
    hidden: false,
  };

  constructor(props) {
    super(props);
    this.onScroll = this.onScroll.bind(this);
    this.onRef = this.onRef.bind(this);
    this.onLayout = this.onLayout.bind(this);
  }

  componentDidMount() {
    this.setupScrollListener();
  }

  componentDidUpdate(prevProps, prevState) {
    // 检查上下文是否发生变化
    if (this.prevScrollY !== this.context.scrollY) {
      this.cleanupScrollListener(this.prevScrollY);
      this.setupScrollListener();
      this.prevScrollY = this.context.scrollY;
    }
  }

  componentWillUnmount() {
    this.cleanupScrollListener(this.context.scrollY);
  }

  setupScrollListener() {
    if (!this.context.scrollY) {
      return;
    }
    this.listenerId = this.context.scrollY.addListener(this.onScroll);
    this.prevScrollY = this.context.scrollY;
  }

  cleanupScrollListener(scrollY) {
    if (scrollY && this.listenerId) {
      scrollY.removeListener(this.listenerId);
    }
  }

  onRef(ref) {
    this.ref = ref;
  }

  onLayout(e) {
    if (this.props.onLayout) {
      this.props.onLayout(e);
    }
    if (!this.ref) {
      return;
    }
    const layout = e.nativeEvent.layout;
    this.height = layout.height;
    this.ref.measure((x, y, width, height, pageX, pageY) => {
      this.initialPageY = pageY;
    });
  }

  onScroll(event) {
    if (!this.context.scrollPageY) {
      return;
    }
    const pageY = this.initialPageY - event.value;
    this.triggerEvents(this.context.scrollPageY, pageY, pageY + this.height);
  }

  triggerEvents(value, top, bottom) {
    const { bottomOffset, topOffset } = this.props;
    
    // 检查是否触顶
    const isTouchingTop = value >= top + topOffset;
    if (!this.state.touched && isTouchingTop) {
      this.setState({ touched: true });
      this.props.onBeginHidden();
      this.props.onTouchTop(true);
    } else if (this.state.touched && !isTouchingTop) {
      this.setState({ touched: false });
      this.props.onDisplay();
      this.props.onTouchTop(false);
    }

    // 检查是否触底
    const isTouchingBottom = value >= bottom + bottomOffset;
    if (!this.state.hidden && isTouchingBottom) {
      this.setState({ hidden: true });
      this.props.onHide();
      this.props.onTouchBottom(true);
    } else if (this.state.hidden && !isTouchingBottom) {
      this.setState({ hidden: false });
      this.props.onBeginDisplayed();
      this.props.onTouchBottom(false);
    }
  }

  render() {
    const {
      onBeginHidden,
      onHide,
      onBeginDisplayed,
      onDisplay,
      onTouchTop,
      onTouchBottom,
      ...viewProps
    } = this.props;

    return (
      <View 
        ref={this.onRef} 
        collapsable={false} 
        {...viewProps} 
        onLayout={this.onLayout}
      >
        {this.props.children}
      </View>
    );
  }
}

export default TriggeringView;