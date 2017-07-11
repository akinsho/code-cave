//@flow
import React, { Component } from 'react';
import propTypes from 'prop-types';
import { connect } from 'react-redux';
import { graphql, compose } from 'react-apollo';
import styled from 'styled-components';
import AceEditor from 'react-ace';
import brace from 'brace';

import 'brace/theme/tomorrow_night';
import 'brace/theme/monokai';
import 'brace/theme/github';
import 'brace/theme/tomorrow';
import 'brace/theme/solarized_dark';
import 'brace/theme/terminal';
import 'brace/theme/textmate';

import 'brace/mode/javascript';
import 'brace/mode/java';
import 'brace/mode/ruby';

import * as queries from './../queries/';
import { Title, RoundButton, Button, Container, flex, Grid } from './Styled';

import {
  saveCode,
  changeTheme,
  changeFontSize,
  changeLanguage,
  toggleMenu
} from './../actions/';

import Options from './Options';
import CodeBlock from './CodeBlock';

const SaveButton = Button.extend`
  font-size: 1.3em;
  margin: 0.5em;
  min-width: 8em;
  width: auto;
`;

const MenuButton = RoundButton.extend`
  top:  1em;
  left: 1em;
  position: absolute;
`;

const EditorContainer = Container.extend`
  flex-direction: column;
  position: relative;
  height: 100vh;
  min-width: 100vw;
  width: auto;
  overflowX:scroll;
`;

const EditorViews = styled.div`
  width: 100%;
  height: 100%;
  ${flex}
`;

const CodeEditor = styled(AceEditor)`
  width: 80%;
  height: 100%;
  box-shadow: -1px 2px 0 rgba(0, 0, 0, 0.5);
  margin: 0.2em;
`;

const NoCode = Title.extend`
  width: 100%;
  text-align: center;
  padding: 0.2em;
`;

class Editor extends Component {
  state = {
    code: '',
    languages: ['javascript', 'java', 'ruby'],
    themes: [
      'tomorrow_night',
      'monokai',
      'github',
      'tomorrow',
      'textmate',
      'solarized_dark',
      'terminal'
    ]
  };

  generateProps = (propsObj: Object | void) => ({
    ...this.state,
    ...this.props,
    ...propsObj
  });

  handleMenuClick = (e: Event) => {
    this.props.toggleMenu();
  };

  handleChange = (code: string) => {
    this.props.saveCode(code);
    //this.setState({ code });
  };

  editCode = (code: string) => {
    this.props.saveCode(code);
    //this.setState({ code });
  };

  saveCurrentCode = async () => {
    const { code } = this.state;
    const { user: { signedIn }, mutate, history } = this.props;
    this.props.saveCode(code);
    if (signedIn) {
      const received = await mutate({
        variables: {
          code,
          user_id: signedIn.id
        }
      });
    } else {
      history.push('/login');
    }
  };

  renderUserCode = signedIn => {
    if (signedIn.code) {
      return signedIn.code.map(({ code, id }) => (
        <CodeBlock
          editCode={this.editCode}
          code={code}
          language="javascript"
          style="atomOneDark"
          key={id}
        />
      ));
    } else {
      return <NoCode>No Saved Code</NoCode>;
    }
  };

  render() {
    const props = this.generateProps({ onClick: this.handleMenuClick });
    const {
      editorConfig: { theme, language, code },
      user: { signedIn },
      data: { users }
    } = this.props;
    return (
      <EditorContainer row>
        <Options {...props} />
        <Title>Editor</Title>
        <MenuButton {...props} />
        <EditorViews>
          <CodeEditor
            enableBasicAutoCompletion={true}
            width={'70%'}
            height={'35em'}
            value={code}
            onChange={this.handleChange}
            mode={language}
            theme={theme}
            editorProps={{ $blockScrolling: true }}
          />
          <SaveButton onClick={this.saveCurrentCode}>
            {signedIn ? 'Save' : 'Sign in to Save'}
          </SaveButton>
        </EditorViews>
        {signedIn && <Grid>{this.renderUserCode(signedIn)}</Grid>}
      </EditorContainer>
    );
  }
}

const mapStateToProps = ({
  user,
  editorConfig
}: {
  user: Object,
  editorConfig: Object
}) => ({
  editorConfig,
  user
});

export default compose(
  graphql(queries.usersQuery),
  graphql(queries.addCodeMutation, {
    options: ({ user_id, code }: { user_id: string, code: string }) => ({
      variables: { user_id, code },
      refetchQueries: [
        {
          query: queries.usersQuery
        }
      ]
    })
  }),
  connect(mapStateToProps, {
    saveCode,
    changeFontSize,
    changeTheme,
    changeLanguage,
    toggleMenu
  })
)(Editor);
