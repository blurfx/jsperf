<script lang="ts">
  import CodeEditor from '../components/CodeEditor.svelte';
  import { writable } from 'svelte/store';
  import '../style.css';
  import { onMount } from 'svelte';

  enum AppState {
    Idle,
    Running,
  }

  type Task = {
    code: string;
    opsPerSec: number | null;
  };

  let preparationCode = '';
  let tasks: Array<Task> = [{ code: '', opsPerSec: null }];
  const state = writable(AppState.Idle);

  const getWorkerUrl = async (path) => {
    const workerScript = await (await fetch(path)).text();
    const code = `${preparationCode};\n${workerScript}`;
    return URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
  };

  const startTest = async () => {
    if ($state === AppState.Running) {
      return true;
    }
    state.set(AppState.Running);
    const durations = await Promise.all(
      tasks.map(async ({ code }) => {
        const worker = new Worker(await getWorkerUrl('./prepareWorker.js'), { type: 'module' });
        worker.postMessage({ code });

        return new Promise((resolve) => {
          worker.onmessage = (event) => {
            worker.terminate();
            resolve(event.data);
          };
        });
      })
    );
    const maxDuration = Math.max(...durations);

    const results = await Promise.all(
      tasks.map(async ({ code }) => {
        const worker = new Worker(await getWorkerUrl('./benchmarkWorker.js'), { type: 'module' });
        worker.postMessage({ code, duration: maxDuration });

        return new Promise((resolve) => {
          worker.onmessage = (event) => {
            worker.terminate();
            resolve(event.data);
          };
        });
      })
    );

    tasks = [...tasks.map((task, i) => ({ ...task, opsPerSec: results[i] }))];
    state.set(AppState.Idle);
    return true;
  };

  const generateShareLink = () => {
    const data = {
      preparationCode,
      tasks,
    };
    // to base64 and set hash
    const url = new URL(window.location.href);
    url.hash = btoa(JSON.stringify(data));
    window.history.replaceState(null, '', url.href);
    navigator.clipboard
      .writeText(url.href)
      .then(() => {
        alert('Link copied to clipboard!');
      })
      .catch(() => {
        alert('Failed to copy link to clipboard.\nBut you can still copy it manually from the address bar.');
      });
  };

  const loadShareLink = () => {
    const url = new URL(window.location.href);
    if (url.hash) {
      const data = JSON.parse(atob(url.hash.slice(1)));
      preparationCode = data.preparationCode;
      tasks = data.tasks;
    }
  };

  const addTask = () => {
    tasks = [...tasks, { code: '', opsPerSec: null }];
  };

  const removeTask = (index) => {
    tasks = tasks.filter((_, i) => i !== index);
  };

  onMount(() => {
    loadShareLink();
  });
</script>

<main>
  <h1>jsperf</h1>
  <div>
    <div class="header">
      <h2>Preparation</h2>
      <div class="controls">
        <button on:click={generateShareLink}>Share</button>
        <button class="w130" on:click={startTest} disabled={$state === AppState.Running}>
          {#if $state === AppState.Running}
            ⏳ Running...
          {:else}
            ⏵ Start Test
          {/if}
        </button>
      </div>
    </div>
    <CodeEditor bind:value={preparationCode} on:change={({ detail }) => (preparationCode = detail.value)} />

    <div class="header">
      <h2>Test cases</h2>
      <button on:click={addTask}>Add Task</button>
    </div>
    <div class="code-list">
      {#each tasks as { code, opsPerSec }, index (index)}
        <div>
          <div class="header code-item-header">
            <div>
              <span>Task {index + 1}</span>
              {#if opsPerSec}
                <span> ({new Intl.NumberFormat('en-US').format(opsPerSec)} ops/s)</span>
              {/if}
            </div>
            <button on:click={() => removeTask(index)}>Remove</button>
          </div>
          <CodeEditor bind:value={code} runTestCallback={startTest} />
        </div>
      {/each}
    </div>
  </div>
</main>

<style>
  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    background-color: #4f4f5a;
    color: #fff;
    font-size: 1rem;
    cursor: pointer;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .w130 {
    width: 130px;
  }

  .controls {
    display: flex;
    gap: 1rem;
  }

  .code-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .code-item-header {
    font-size: 1.125rem;
    font-weight: 500;
    margin: 8px 0;
  }
</style>
