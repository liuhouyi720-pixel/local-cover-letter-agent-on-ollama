Set WshShell = CreateObject("WScript.Shell")
scriptPath = "D:\AI\Vibe agent\cover-letter-agent-mvp0\start-ipex-ollama-gpu.bat"
WshShell.Run Chr(34) & scriptPath & Chr(34), 0, False
