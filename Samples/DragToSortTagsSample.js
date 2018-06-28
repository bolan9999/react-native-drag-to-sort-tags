/**
 * Author: Shi(bolan0000@icloud.com)
 * Date: 2018/6/9
 * Copyright (c) 2018, AoTang, Inc.
 *
 * Description: DragToSortTags测试组件
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { DragToSortTags } from "../lib";

export class DragToSortTagsSample extends React.Component{
  render() {
    const tags = [];
    for (let i = 0; i < 15; ++i) {
      tags.push("Tag " + i);
    }
    return (
      <View style={styles.container}>
        <DragToSortTags
          style={styles.container}
          tags={tags}
          renderTag={this._renderTag}
        />
      </View>
    );
  }

  _renderTag = (tag: string) => {
    return (
      <View style={styles.button}>
        <Text style={styles.text}>{tag}</Text>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop:40,
    backgroundColor: "white"
  },
  button: {
    width: 100,
    height: 50,
    backgroundColor: "#F3F3F3",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center"
  }
});

