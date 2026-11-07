import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';

const logEl = document.getElementById('log-output') as HTMLPreElement;
function log(msg: string) {
  const time = new Date().toLocaleTimeString();
  if (logEl) {
    logEl.textContent += `[${time}] ${msg}\n`;
    logEl.scrollTop = logEl.scrollHeight;
  }
}

document.getElementById('clear-log')?.addEventListener('click', () => {
  if (logEl) logEl.textContent = '';
});
document.getElementById('copy-log')?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(logEl?.textContent || '');
    log('日志已复制到剪贴板');
  } catch (e) {
    log('复制失败');
  }
});

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    const id = tab.getAttribute('data-tab');
    if (id) document.getElementById(`panel-${id}`)?.classList.add('active');
  });
});

const abav1Path = document.getElementById('abav1Path') as HTMLInputElement;
const abav1Status = document.getElementById('abav1Status') as HTMLSpanElement;
document.getElementById('testAbav1')?.addEventListener('click', async () => {
  try {
    const res = await invoke('test_abav1', { path: abav1Path?.value || null });
    if (abav1Status) abav1Status.textContent = String(res);
    log('测试 ab-av1: ' + res);
  } catch (e: any) {
    if (abav1Status) abav1Status.textContent = '错误';
    log('测试失败: ' + e);
  }
});

document.getElementById('auto-browse-input')?.addEventListener('click', async () => {
  const file = await open({ multiple: false, filters: [{ name: 'Video', extensions: ['mp4', 'mkv', 'webm', 'avi', 'mov'] }] });
  if (file && typeof file === 'string') {
    (document.getElementById('auto-input') as HTMLInputElement).value = file;
  }
});
document.getElementById('auto-browse-output')?.addEventListener('click', async () => {
  const file = await save({ filters: [{ name: 'Video', extensions: ['mkv', 'mp4', 'webm'] }] });
  if (file && typeof file === 'string') {
    (document.getElementById('auto-output') as HTMLInputElement).value = file;
  }
});
document.getElementById('auto-start')?.addEventListener('click', async () => {
  try {
    const args = {
      input: (document.getElementById('auto-input') as HTMLInputElement).value,
      output: (document.getElementById('auto-output') as HTMLInputElement).value || null,
      preset: (document.getElementById('auto-preset') as HTMLSelectElement).value,
      minVmaf: (document.getElementById('auto-minvmaf') as HTMLInputElement).value,
      encoder: (document.getElementById('auto-encoder') as HTMLInputElement).value || null,
      extra: (document.getElementById('auto-extra') as HTMLInputElement).value || null,
      abav1Path: abav1Path?.value || null,
    };
    log('开始自动编码: ' + args.input);
    await invoke('run_auto_encode', args);
    log('已启动自动编码任务');
  } catch (e: any) {
    log('启动失败: ' + e);
  }
});

document.getElementById('crf-browse-input')?.addEventListener('click', async () => {
  const file = await open({ multiple: false, filters: [{ name: 'Video', extensions: ['mp4', 'mkv', 'webm'] }] });
  if (file && typeof file === 'string') {
    (document.getElementById('crf-input') as HTMLInputElement).value = file;
  }
});
document.getElementById('crf-start')?.addEventListener('click', async () => {
  try {
    const args = {
      input: (document.getElementById('crf-input') as HTMLInputElement).value,
      preset: (document.getElementById('crf-preset') as HTMLSelectElement).value,
      minVmaf: (document.getElementById('crf-minvmaf') as HTMLInputElement).value,
      extra: (document.getElementById('crf-extra') as HTMLInputElement).value || null,
      abav1Path: abav1Path?.value || null,
    };
    log('开始 CRF 搜索: ' + args.input);
    await invoke('run_crf_search', args);
    log('已启动 CRF 搜索任务');
  } catch (e: any) {
    log('启动失败: ' + e);
  }
});

document.getElementById('sample-browse-input')?.addEventListener('click', async () => {
  const file = await open({ multiple: false });
  if (file && typeof file === 'string') {
    (document.getElementById('sample-input') as HTMLInputElement).value = file;
  }
});
document.getElementById('sample-start')?.addEventListener('click', async () => {
  try {
    const args = {
      input: (document.getElementById('sample-input') as HTMLInputElement).value,
      preset: (document.getElementById('sample-preset') as HTMLSelectElement).value,
      crf: (document.getElementById('sample-crf') as HTMLInputElement).value,
      abav1Path: abav1Path?.value || null,
    };
    log('开始样本编码: ' + args.input);
    await invoke('run_sample_encode', args);
    log('已启动样本编码任务');
  } catch (e: any) {
    log('启动失败: ' + e);
  }
});

document.getElementById('encode-browse-input')?.addEventListener('click', async () => {
  const file = await open({ multiple: false });
  if (file && typeof file === 'string') {
    (document.getElementById('encode-input') as HTMLInputElement).value = file;
  }
});
document.getElementById('encode-bpaste-output')?.addEventListener('click', async () => {
  const file = await save({ filters: [{ name: 'Video', extensions: ['mkv', 'mp4'] }] });
  if (file && typeof file === 'string') {
    (document.getElementById('encode-output') as HTMLInputElement).value = file;
  }
});
document.getElementById('encode-start')?.addEventListener('click', async () => {
  try {
    const args = {
      input: (document.getElementById('encode-input') as HTMLInputElement).value,
      output: (document.getElementById('encode-output') as HTMLInputElement).value,
      preset: (document.getElementById('encode-preset') as HTMLSelectElement).value,
      crf: (document.getElementById('encode-crf') as HTMLInputElement).value,
      encoder: (document.getElementById('encode-encoder') as HTMLInputElement).value || null,
      extra: (document.getElementById('encode-extra') as HTMLInputElement).value || null,
      abav1Path: abav1Path?.value || null,
    };
    log('开始直接编码: ' + args.input);
    await invoke('run_encode', args);
    log('已启动直接编码任务');
  } catch (e: any) {
    log('启动失败: ' + e);
  }
});

document.getElementById('vmaf-browse-ref')?.addEventListener('click', async () => {
  const file = await open({ multiple: false });
  if (file && typeof file === 'string') {
    (document.getElementById('vmaf-ref') as HTMLInputElement).value = file;
  }
});
document.getElementById('vmaf-browse-dist')?.addEventListener('click', async () => {
  const file = await open({ multiple: false });
  if (file && typeof file === 'string') {
    (document.getElementById('vmaf-dist') as HTMLInputElement).value = file;
  }
});
document.getElementById('vmaf-start')?.addEventListener('click', async () => {
  try {
    const args = {
      reference: (document.getElementById('vmaf-ref') as HTMLInputElement).value,
      distorted: (document.getElementById('vmaf-dist') as HTMLInputElement).value,
      abav1Path: abav1Path?.value || null,
    };
    log('开始 VMAF 对比: ' + args.reference + ' vs ' + args.distorted);
    await invoke('run_vmaf', args);
    log('已启动 VMAF 对比任务');
  } catch (e: any) {
    log('启动失败: ' + e);
  }
});

// @ts-ignore
if ((window as any).__TAURI__?.event?.listen) {
  (window as any).__TAURI__.event.listen('abav1-log', (event: any) => {
    log(event.payload);
  });
}
