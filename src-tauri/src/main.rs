#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Deserialize;
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use tauri::{Emitter, Manager};

#[derive(Deserialize)]
struct AutoEncodeArgs {
    input: String,
    output: Option<String>,
    preset: String,
    #[serde(rename = "minVmaf")]
    min_vmaf: String,
    encoder: Option<String>,
    extra: Option<String>,
    #[serde(rename = "abav1Path")]
    abav1_path: Option<String>,
}

#[derive(Deserialize)]
struct CrfSearchArgs {
    input: String,
    preset: String,
    #[serde(rename = "minVmaf")]
    min_vmaf: String,
    extra: Option<String>,
    #[serde(rename = "abav1Path")]
    abav1_path: Option<String>,
}

#[derive(Deserialize)]
struct SampleEncodeArgs {
    input: String,
    preset: String,
    crf: String,
    #[serde(rename = "abav1Path")]
    abav1_path: Option<String>,
}

#[derive(Deserialize)]
struct EncodeArgs {
    input: String,
    output: String,
    preset: String,
    crf: String,
    encoder: Option<String>,
    extra: Option<String>,
    #[serde(rename = "abav1Path")]
    abav1_path: Option<String>,
}

#[derive(Deserialize)]
struct VmafArgs {
    reference: String,
    distorted: String,
    #[serde(rename = "abav1Path")]
    abav1_path: Option<String>,
}

fn get_abav1_cmd(abav1_path: &Option<String>) -> String {
    match abav1_path {
        Some(p) if !p.is_empty() => p.clone(),
        _ => {
            #[cfg(target_os = "windows")]
            {
                "ab-av1.exe".to_string()
            }
            #[cfg(not(target_os = "windows"))]
            {
                "ab-av1".to_string()
            }
        }
    }
}

#[tauri::command]
fn test_abav1(path: Option<String>) -> Result<String, String> {
    let cmd = get_abav1_cmd(&path);
    let output = Command::new(&cmd)
        .arg("--version")
        .output()
        .map_err(|e| format!("无法启动 {}: {}", cmd, e))?;
    if output.status.success() {
        let out = String::from_utf8_lossy(&output.stdout);
        Ok(out.trim().to_string())
    } else {
        let err = String::from_utf8_lossy(&output.stderr);
        Err(err.trim().to_string())
    }
}

fn spawn_abav1(app: tauri::AppHandle, mut cmd: Command) {
    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());
    std::thread::spawn(move || {
        let mut child = match cmd.spawn() {
            Ok(c) => c,
            Err(e) => {
                let _ = app.emit("abav1-log", format!("启动失败: {}", e));
                return;
            }
        };
        if let Some(stdout) = child.stdout.take() {
            let app2 = app.clone();
            std::thread::spawn(move || {
                let reader = BufReader::new(stdout);
                for line in reader.lines() {
                    if let Ok(l) = line {
                        let _ = app2.emit("abav1-log", l);
                    }
                }
            });
        }
        if let Some(stderr) = child.stderr.take() {
            let app3 = app.clone();
            std::thread::spawn(move || {
                let reader = BufReader::new(stderr);
                for line in reader.lines() {
                    if let Ok(l) = line {
                        let _ = app3.emit("abav1-log", l);
                    }
                }
            });
        }
        let _ = child.wait();
        let _ = app.emit("abav1-log", "任务结束");
    });
}

#[tauri::command]
fn run_auto_encode(app: tauri::AppHandle, args: AutoEncodeArgs) {
    let cmd_str = get_abav1_cmd(&args.abav1_path);
    let mut cmd = Command::new(cmd_str.clone());
    cmd.arg("auto-encode")
        .arg("--preset")
        .arg(&args.preset)
        .arg("--min-vmaf")
        .arg(&args.min_vmaf)
        .arg("--input")
        .arg(&args.input);
    if let Some(o) = args.output {
        if !o.is_empty() {
            cmd.arg("--output").arg(o);
        }
    }
    if let Some(e) = args.encoder {
        if !e.is_empty() {
            cmd.arg("--encoder").arg(e);
        }
    }
    if let Some(ex) = args.extra {
        for token in ex.split_whitespace() {
            cmd.arg(token);
        }
    }
    let _ = app.emit("abav1-log", format!("执行: {}", cmd_str));
    spawn_abav1(app, cmd);
}

#[tauri::command]
fn run_crf_search(app: tauri::AppHandle, args: CrfSearchArgs) {
    let cmd_str = get_abav1_cmd(&args.abav1_path);
    let mut cmd = Command::new(cmd_str.clone());
    cmd.arg("crf-search")
        .arg("--preset")
        .arg(&args.preset)
        .arg("--min-vmaf")
        .arg(&args.min_vmaf)
        .arg("--input")
        .arg(&args.input);
    if let Some(ex) = args.extra {
        for token in ex.split_whitespace() {
            cmd.arg(token);
        }
    }
    let _ = app.emit("abav1-log", format!("执行: {}", cmd_str));
    spawn_abav1(app, cmd);
}

#[tauri::command]
fn run_sample_encode(app: tauri::AppHandle, args: SampleEncodeArgs) {
    let cmd_str = get_abav1_cmd(&args.abav1_path);
    let mut cmd = Command::new(cmd_str.clone());
    cmd.arg("sample-encode")
        .arg("--preset")
        .arg(&args.preset)
        .arg("--crf")
        .arg(&args.crf)
        .arg("--input")
        .arg(&args.input);
    let _ = app.emit("abav1-log", format!("执行: {}", cmd_str));
    spawn_abav1(app, cmd);
}

#[tauri::command]
fn run_encode(app: tauri::AppHandle, args: EncodeArgs) {
    let cmd_str = get_abav1_cmd(&args.abav1_path);
    let mut cmd = Command::new(cmd_str.clone());
    cmd.arg("encode")
        .arg("--preset")
        .arg(&args.preset)
        .arg("--crf")
        .arg(&args.crf)
        .arg("--input")
        .arg(&args.input)
        .arg("--output")
        .arg(&args.output);
    if let Some(e) = args.encoder {
        if !e.is_empty() {
            cmd.arg("--encoder").arg(e);
        }
    }
    if let Some(ex) = args.extra {
        for token in ex.split_whitespace() {
            cmd.arg(token);
        }
    }
    let _ = app.emit("abav1-log", format!("执行: {}", cmd_str));
    spawn_abav1(app, cmd);
}

#[tauri::command]
fn run_vmaf(app: tauri::AppHandle, args: VmafArgs) {
    let cmd_str = get_abav1_cmd(&args.abav1_path);
    let mut cmd = Command::new(cmd_str.clone());
    cmd.arg("vmaf")
        .arg("--reference")
        .arg(&args.reference)
        .arg("--distorted")
        .arg(&args.distorted);
    let _ = app.emit("abav1-log", format!("执行: {}", cmd_str));
    spawn_abav1(app, cmd);
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            test_abav1,
            run_auto_encode,
            run_crf_search,
            run_sample_encode,
            run_encode,
            run_vmaf
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
