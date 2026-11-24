using System.Collections.Generic;
using EasaCompliance.Core.Models;

namespace EasaCompliance.Core.Interfaces
{
    /// <summary>
    /// Abstraction for Revit BIM interactions and live document extraction.
    /// Decouples the WPF MVVM presentation layer (EasaCompliance.UI) from direct
    /// dependencies on Autodesk Revit API binaries and avoids circular dependencies.
    /// </summary>
    public interface IRevitNavigator
    {
        /// <summary>
        /// Selects the element and zooms the active view to fit it.
        /// </summary>
        bool HighlightAndZoomElement(long elementId);

        /// <summary>
        /// Applies temporary element isolation in the active Revit view.
        /// </summary>
        bool IsolateElementTemporary(long elementId);

        /// <summary>
        /// Gets the active Revit document file name / title.
        /// </summary>
        string? ActiveDocumentTitle { get; }

        /// <summary>
        /// Gets the full file path of the active Revit document.
        /// </summary>
        string? ActiveDocumentPath { get; }

        /// <summary>
        /// Indicates if an active Revit document is currently loaded.
        /// </summary>
        bool HasActiveDocument { get; }

        /// <summary>
        /// Extracts real BIM rooms, doors, equipment, and parameters from the active Revit model.
        /// </summary>
        BimExtractionResult ExtractActiveModelData();
    }
}
