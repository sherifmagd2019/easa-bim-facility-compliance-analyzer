using System.Windows;
using EasaCompliance.UI.ViewModels;

namespace EasaCompliance.UI.Views
{
    public partial class MainWindow : Window
    {
        public MainWindow(MainViewModel viewModel)
        {
            InitializeComponent();
            DataContext = viewModel;
        }
    }

    public partial class FindingsExplorerView : Window
    {
        public FindingsExplorerView(FindingsViewModel viewModel)
        {
            DataContext = viewModel;
            Title = "EASA Findings Explorer";
            Width = 900;
            Height = 600;
        }
    }

    public partial class RequirementsLibraryView : Window
    {
        public RequirementsLibraryView(RequirementsViewModel viewModel)
        {
            DataContext = viewModel;
            Title = "EASA Regulatory Requirements Library";
            Width = 900;
            Height = 600;
        }
    }
}
