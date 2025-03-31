package main

import (
	"context"
	"fmt"
	"os"

	"os/exec"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	runtime.WindowSetPosition(ctx, -4000, 1880)
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("%s, I TOLD YOU... NOT TO DO IT", name)
}

func (a *App) GetMonitorsJSON() string {
	out, err := exec.Command("hyprctl", "monitors", "-j").Output()
	if err != nil {
		return "Error: " + err.Error()
	}
	return string(out)
}

func (a *App) ReadMonitors() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return "Error getting home directory: " + err.Error()
	} else {
		fmt.Println(home)
	}

	path := home + "/.config/hypr/monitors.conf"
	res, err := os.ReadFile(path)
	if err != nil {
		return "Error reading file: " + err.Error()
	}
	return string(res)
}

func (a *App) WriteMonitorConfig(content string) string {
	home, err := os.UserHomeDir()
	if err != nil {
		return "Failed to get home directory: " + err.Error()
	}

	path := home + "/.config/hypr/monitors.conf"
	err = os.WriteFile(path, []byte(content), 0644)
	if err != nil {
		return "Failed to write file: " + err.Error()
	}

	return "Success"
}
