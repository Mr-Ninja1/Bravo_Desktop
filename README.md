# Bravo Desktop

A desktop application for the Bravo checklist mobile app, built with Electron and React. This application allows users to preview, manage, and export forms that were created and saved on the mobile version.

## 📋 Overview

Bravo Desktop is the companion desktop version of the Bravo checklist mobile application. It provides a seamless experience for form preview, management, and export capabilities with a modern, responsive user interface.

**Current Version:** 0.0.5

## ✨ Features

- 📱 Preview mobile-saved forms
- 📤 Export forms to various formats
- 🔐 Secure credential management with keytar
- 📝 Signature canvas support for form signing
- 🔄 Automatic over-the-air (OTA) updates via electron-updater
- 🎨 Modern React-based UI with responsive design
- ⚡ Fast bundling with esbuild during development

## 🛠️ Tech Stack

- **Runtime:** Electron 25.0.0
- **UI Framework:** React 19.2.3 + React DOM 19.2.3
- **Styling:** CSS (2.3% of codebase)
- **Markup:** HTML (0.7% of codebase)
- **Build Tool:** Node.js with esbuild & electron-builder
- **Code:** JavaScript (97% of codebase)
- **Signing:** react-native-signature-canvas 5.0.1
- **Security:** keytar 7.9.0 for secure credential storage
- **Updates:** electron-updater 4.6.5

## 📦 Installation

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Clone & Install

```bash
git clone https://github.com/Mr-Ninja1/Bravo_Desktop.git
cd Bravo_Desktop
npm install
