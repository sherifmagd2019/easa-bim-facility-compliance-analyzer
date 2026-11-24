using System;
using System.Windows;
using EasaCompliance.UI.Views;
using EasaCompliance.UI.ViewModels;

namespace EasaCompliance.Launcher
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// Standalone Desktop Launcher for EASA BIM Facility Compliance Analyzer
    /// </summary>
    public partial class App : Application
    {
        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);
            var viewModel = new MainViewModel();
            viewModel.RunFullAssessmentCommand.Execute(null);
            var mainWindow = new MainWindow(viewModel);
            mainWindow.Show();
        }
    }
}
