/**
 *
 * Sortable ScrollView
 *
 * https://github.com/ocleo1
 *
 * @providesModule SortableScrollView
 *
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var TimerMixin = require('react-timer-mixin');

var {
  StyleSheet,
  Text,
  View,
  ScrollView,
  PanResponder,
  NativeModules
} = ReactNative;

var UIManager = NativeModules.UIManager;

const LONG_PRESS_THRESHOLD = 100;
const INTERVAL = 15;
const ITEM_VIEW_HEIGHT = 89; // marginTop + marginBottom + paddingTop + paddingBottom + itemHeight + 1
const SENSITIVE_COEFFICIENT = 0.768; // bigger the coefficient, lower the move sensitive

const ITEMS = [
  'test0', 'test1', 'test2', 'test3', 'test4',
  'test5', 'test6', 'test7', 'test8', 'test9'
];

var SortableScrollView = React.createClass({
  mixins: [TimerMixin],

  getInitialState(){
      return {
        items: [].concat(ITEMS), // Clone
        newIndex: -1,
        contentOffsetY: 0,
        scrollViewTop: 0,
        timer: 0,
        moveable: false
      }
  },

  componentWillMount(){
    var self = this;
    this._itemWrapperResponder = {
      onStartShouldSetResponder: ()=> false,
      onMoveShouldSetResponder: ()=> true,
      onResponderGrant: ()=>{ console.log('wrapper grant') },
      onResponderMove: ()=>{ console.log('wrapper move') },
      onResponderRelease: ()=>{ console.log('wrapper release') },
      onResponderTerminationRequest: ()=>{ console.log('wrapper termination request') },
      onResponderTerminate: ()=>{ console.log('wrapper terminate') }
    },
    this._itemPanResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: ()=> true,
      onPanResponderGrant: (evt, gs)=>{
        console.log('item grant');
        self.state.currentItemIndex = Math.floor((self.state.contentOffsetY + evt.nativeEvent.pageY - self.state.scrollViewTop) / ITEM_VIEW_HEIGHT);
        console.log(self.state.currentItemIndex);
        self.timerId = self.setInterval(self._tikTok, INTERVAL);
      },
      onPanResponderMove: (evt, gs)=>{
        if (!self.state.moveable) return;
        console.log('item move');
        // extract current item from item list
        var currentItem = self.state.items.splice(self.state.newIndex, 1);
        // gs.dy > 0, Move down
        // gs.dy < 0, Move up
        // gs.dy == 0, no change
        var movedPosition = gs.dy / (ITEM_VIEW_HEIGHT * SENSITIVE_COEFFICIENT);
        movedPosition = gs.dy < 0 ? Math.ceil(movedPosition) : Math.floor(movedPosition);
        self.state.newIndex = self.state.currentItemIndex + movedPosition;
        // insert item to new position
        self.state.items.splice(self.state.newIndex, 0, currentItem);
        self.setState(self.state);
      },
      onPanResponderRelease: (evt, gs)=>{
        console.log('item release');
        self.clearInterval(self.timerId);
        self.state.timer = 0;
        self.state.moveable = false;
        delete self.state.newIndex; // reset background color
        self.setState(self.state);
      },
      onPanResponderTerminationRequest: ()=>{
        console.log('item termination request');
        if (self.state.timer < LONG_PRESS_THRESHOLD) {
          return true;
        }
        return false;
      },
      onPanResponderTerminate: ()=>{
        console.log('item terminate');
        self.clearInterval(self.timerId);
        self.state.timer = 0;
        self.state.moveable = false;
        delete self.state.newIndex; // reset background color
        self.setState(self.state);
      }
    })
  },

  componentDidMount() {
    var self = this;
    var scrollViewHandle = ReactNative.findNodeHandle(this.refs.scrollView);
    // measure scroll view component top value
    UIManager.measure(scrollViewHandle, (frameX, frameY, width, height, pageX, pageY) => {
      self.state.scrollViewTop = pageY;
    });
  },

  _tikTok() {
    if (this.state.timer >= LONG_PRESS_THRESHOLD) {
      console.log('long press');
      this.clearInterval(this.timerId);
      this.state.moveable = true;
      // in order to set background color to current item
      this.state.newIndex = this.state.currentItemIndex;
    } else {
      this.state.timer += INTERVAL;
    }
    this.setState(this.state);
  },

  _onScroll(e) {
    this.state.contentOffsetY = e.nativeEvent.contentOffset.y;
  },

  render() {
    return (
      <View style={styles.container}>
        <ScrollView
          ref="scrollView"
          style={styles.scrollView}
          onScroll={this._onScroll}
          scrollEventThrottle={200}>
          <View
            {...this._itemWrapperResponder}
            style={styles.itemViewWrapper}>
            {
              this.state.items.map((item, i) => {
                var backgroundColor;
                if (this.state.newIndex == i) {
                  backgroundColor = 'red';
                } else {
                  backgroundColor = '#eaeaea';
                }
                return (
                  <View
                    {...this._itemPanResponder.panHandlers}
                    style={[styles.itemView, {"backgroundColor": backgroundColor}]}
                    key={i}>
                  <Text style={styles.text}>{item}</Text>
                  </View>
                );
              })
            }
          </View>
        </ScrollView>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  scrollView: {
    height: 300
  },
  itemViewWrapper: {
    // ...
  },
  itemView: {
    margin: 7,
    padding: 5,
    alignItems: 'center',
    borderRadius: 3,
  },
  text: {
    width: 64,
    height: 64
  }
});

module.exports = SortableScrollView;
