# Build and Installation Guide — Revit Add-In

## 1. Resolution of Compiler Errors & Warnings

### A. Resolution of Missing .NET 10 SDK Banner & CS1705 Version Mismatches
- **Cause**: The previous solution default was `Debug R27` targeting `.NET 10` (`net10.0-windows`). When opened on machines without the .NET 10 preview SDK installed, Visual Studio displayed: *"You are targeting .NET 10.0, which is not installed. Click Install to install the .NET 10.0 SDK"*, and compilation failed with `CS1705` version mismatch errors between `System.Text.Json` / `System.Runtime` 10.0.0.0 and older assemblies.
- **Fix**: 
  1. The default configuration in `EasaBimCompliance.sln` is now **`Debug | x64`**, targeting **`.NET 8 (net8.0-windows)`** — the official production LTS runtime supported by Autodesk Revit 2025/2026 and pre-installed in Visual Studio 2022.
  2. All 10 projects in the solution now default to `net8.0-windows` when no framework is specified.
  3. `Directory.Build.props` centrally aligns dependencies across all 10 projects:
     - **`Debug | x64`** / **`Release | x64`**: Targets **`net8.0-windows`** (zero missing-SDK warnings, 0 errors).
     - **`Debug R27 | x64`** / **`Release R27 | x64`**: Targets **`net10.0-windows`** (for Revit 2027).

### B. Resolution of CS0103 (`ActiveUiDocument`)
- **Cause**: In `RibbonCommands.cs`, the external commands referenced `ActiveUiDocument`. Under Nice3point.Revit.Toolkit, the property exposed by `ExternalCommand` is `UiDocument` (or `ExternalCommandData.Application.ActiveUIDocument`).
- **Fix**: Implemented `BaseRibbonCommand` which defines a safe `ActiveUiDocument` property resolving `UiDocument ?? ExternalCommandData?.Application?.ActiveUIDocument`. All commands (`FacilityAnalyzerCommand`, `AnalyzeModelCommand`, `FindingsExplorerCommand`, `GenerateReportCommand`, etc.) inherit from this base class.

### C. Resolution of CS1061 (`'Room'/'FamilyInstance' does not contain a definition for 'Level'`)
- **Cause**: In `RevitElementHighlighter.cs`, room and door extraction attempted to access `.Level?.Name`. In the Autodesk Revit API, `SpatialElement` (`Room`) and `FamilyInstance` do not possess a public `.Level` property; they use `LevelId` (`ElementId`) or built-in level parameters (`ROOM_LEVEL_ID`, `FAMILY_LEVEL_PARAM`, `INSTANCE_REFERENCE_LEVEL_PARAM`).
- **Fix**: Added `GetElementLevelName(Document doc, Element elem)` which safely inspects `elem.LevelId`, evaluates the level element from the document, and gracefully inspects level parameters across all Revit versions.

---

## 2. Prerequisites
1. **Operating System**: Windows 11 / Windows 10 (64-bit)
2. **IDE**: Visual Studio 2022 (v17.8 or later) with the **".NET desktop development"** workload installed.
3. **SDK**: .NET 8.0 SDK (Standard LTS, pre-installed with Visual Studio 2022).
4. **Target Platform**: Autodesk Revit 2025, 2026, or 2027.

---

## 3. How to Build in Visual Studio 2022 (Zero Errors)
1. Open `EasaBimCompliance.sln` in **Visual Studio 2022**.
2. Notice the default configuration in the top toolbar is **`Debug | x64`** (targeting .NET 8 LTS).
3. Right-click the Solution node in Solution Explorer and choose **"Restore NuGet Packages"**.
4. Click **Build -> Rebuild Solution** (or press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd>).
5. The build completes with **0 Errors**.

*(Optional: If you have installed the .NET 10 SDK and are building specifically for Autodesk Revit 2027 Preview, switch the toolbar dropdown to `Debug R27 | x64`)*.

---

## 4. Build via Command Line (PowerShell / Developer Command Prompt)
```cmd
cd csharp_solution
dotnet restore EasaBimCompliance.sln
dotnet build EasaBimCompliance.sln -c "Debug"
```

To run unit tests:
```cmd
dotnet test tests/EasaCompliance.Tests/EasaCompliance.Tests.csproj -c "Debug"
```

---

## 5. Automatic Deployment to Revit
The post-build target copies the addin manifest and binaries to your Autodesk Revit addins folder:
1. Manifest: `%APPDATA%\Autodesk\Revit\Addins\2025\` (or `2026` / `2027`) `\EasaBimCompliance.addin`
2. Assemblies: `%APPDATA%\Autodesk\Revit\Addins\<Year>\EasaBimCompliance\`
3. Start Autodesk Revit -> Click **"Always Load"** -> Navigate to the **"EASA Compliance"** ribbon tab!
