import React from "react";
import Prism from "prismjs";
import createPrismPlugin from "draft-js-prism-plugin";
import { EditorState } from "draft-js";
import { getDefaultKeyBinding, KeyBindingUtil } from "draft-js";
import "./style.css";
import { getSelectedBlocksList } from "draftjs-utils";

const { hasCommandModifier } = KeyBindingUtil;

const CODE_COMMAND = "code-highlight";
const prismPlugin = createPrismPlugin({
  // It's required to provide your own instance of Prism
  prism: Prism
});

function codeHighlightingEditor(Editor) {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.handleKeyCommand = this.handleKeyCommand.bind(this);
      this.keyBinding = this.keyBinding.bind(this);
      this.addCodeHighlighting = this.addCodeHighlighting.bind(this);
      this.removeCodeHighlighting = this.removeCodeHighlighting.bind(this);
    }

    addCodeHighlighting(editorState) {
      let newContentState = editorState.getCurrentContent();
      const currentSelection = editorState.getSelection();
      getSelectedBlocksList(editorState).forEach(block => {
        const blockMap = newContentState.getBlockMap();
        const data = block.getData().merge({ language: "javascript" });
        const newBlock = block.merge({ data: data, type: "code-block" });
        newContentState = newContentState.merge({
          blockMap: blockMap.set(block.getKey(), newBlock),
          selectionAfter: currentSelection
        });
      });

      const newEditorState = EditorState.push(
        editorState,
        newContentState,
        "change-block-data"
      );
      this.props.onChange(newEditorState);
    }

    removeCodeHighlighting(editorState) {
      let newContentState = editorState.getCurrentContent();
      const currentSelection = editorState.getSelection();
      getSelectedBlocksList(editorState).forEach(block => {
        const blockMap = newContentState.getBlockMap();
        const newBlock = block.merge({ type: "unstyled" });
        newContentState = newContentState.merge({
          blockMap: blockMap.set(block.getKey(), newBlock),
          selectionAfter: currentSelection
        });
      });

      const newEditorState = EditorState.push(
        editorState,
        newContentState,
        "change-block-data"
      );
      this.props.onChange(newEditorState);
    }

    handleKeyCommand(command, editorState) {
      if (command === CODE_COMMAND) {
        if (!editorState.getSelection().getHasFocus()) {
          return;
        }
        const key = editorState.getSelection().getAnchorKey();
        const block = editorState.getCurrentContent().getBlockForKey(key);
        if (block.getType() === "code-block") {
          this.removeCodeHighlighting(editorState);
        } else {
          this.addCodeHighlighting(editorState);
        }
        return "handled";
      }
      if (this.props.handleKeyCommand) {
        return this.props.handleKeyCommand(command, editorState);
      }
      return "not-handled";
    }

    keyBinding(e) {
      if (e.keyCode === 78 && hasCommandModifier(e)) {
        //command+n
        return CODE_COMMAND;
      }
      if (this.props.keyBindingFn) {
        return this.props.keyBindingFn(e);
      }
      return getDefaultKeyBinding(e);
    }

    render() {
      let plugs = [];
      if (this.props.plugins) {
        plugs = this.props.plugins;
      }
      plugs.push(prismPlugin);

      const { handleKeyCommand, keyBindingFn, plugins, ...props } = this.props;
      return (
        <Editor
          plugins={plugs}
          handleKeyCommand={this.handleKeyCommand}
          keyBindingFn={this.keyBinding}
          {...props}
        />
      );
    }
  };
}

window.toolbar.buttons.push({
  icon: "💻",
  command: CODE_COMMAND,
  hint: "Toggle: Apply code highlighting to selected text"
});

module.exports.mutations = {
  BaseEditor: codeHighlightingEditor
};
