<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import CodeMirror from 'svelte-codemirror-editor';
  import { type Command, drawSelection, highlightSpecialChars, type KeyBinding, keymap } from '@codemirror/view';
  import { javascript } from '@codemirror/lang-javascript';
  import { sublime } from '@uiw/codemirror-theme-sublime';
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
  import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';

  export let runTestCallback: Command;
  const dispatch = createEventDispatcher();

  const customKeymap: ReadonlyArray<KeyBinding> = [
    {
      key: 'Ctrl-Enter',
      mac: 'Cmd-Enter',
      run: runTestCallback,
      preventDefault: true,
    },
  ];
  export let value = '';
</script>

<CodeMirror
  bind:value
  basic={false}
  extensions={[
    highlightSpecialChars(),
    history(),
    drawSelection(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    keymap.of([...customKeymap, ...defaultKeymap, ...historyKeymap]),
  ]}
  lang={javascript()}
  theme={sublime}
  on:change={(e) => dispatch('change', { value: e.detail })}
  styles={{
    '&': {
      padding: '8px 10px',
      fontSize: '1.125rem',
    },
    '&.cm-focused': {
      outline: 0,
      borderLeftColor: '#0e9',
    },
  }}
/>
