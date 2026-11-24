using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Autodesk.Revit.DB;
using Autodesk.Revit.DB.Architecture;
using Autodesk.Revit.UI;
using EasaCompliance.Core.Interfaces;
using EasaCompliance.Core.Models;

namespace EasaCompliance.Revit.Services
{
    /// <summary>
    /// Bridges live Revit UI Document actions and live BIM extraction to the decoupled MVVM UI layer.
    /// Developer: Eng. Sherif Ahmad Magaldin
    /// </summary>
    public class RevitBimNavigator : IRevitNavigator
    {
        private readonly UIDocument? _uiDoc;

        public RevitBimNavigator(UIDocument? uiDoc)
        {
            _uiDoc = uiDoc;
        }

        public string? ActiveDocumentTitle => _uiDoc?.Document?.Title;
        public string? ActiveDocumentPath => _uiDoc?.Document?.PathName;
        public bool HasActiveDocument => _uiDoc?.Document != null;

        public bool HighlightAndZoomElement(long elementId)
        {
            if (_uiDoc == null) return false;
            return RevitElementHighlighter.HighlightAndZoomElement(_uiDoc, elementId);
        }

        public bool IsolateElementTemporary(long elementId)
        {
            if (_uiDoc == null) return false;
            return RevitElementHighlighter.IsolateElementTemporary(_uiDoc, elementId);
        }

        /// <summary>
        /// Extracts real rooms, doors, equipment, and metadata from the live Revit document.
        /// </summary>
        public BimExtractionResult ExtractActiveModelData()
        {
            var result = new BimExtractionResult();
            if (_uiDoc?.Document == null)
            {
                result.Warnings.Add("No active Revit document available for extraction.");
                return result;
            }

            var doc = _uiDoc.Document;
            result.DocumentTitle = doc.Title;
            result.DocumentPath = doc.PathName;
            result.RevitVersion = doc.Application.VersionName;

            // Project Information
            if (doc.ProjectInformation != null)
            {
                result.ProjectName = doc.ProjectInformation.Name ?? doc.Title;
                result.ProjectNumber = doc.ProjectInformation.Number ?? "";
            }

            // 1. EXTRACT REAL ROOMS
            try
            {
                var roomCollector = new FilteredElementCollector(doc)
                    .OfCategory(BuiltInCategory.OST_Rooms)
                    .WhereElementIsNotElementType()
                    .ToElements();

                foreach (var elem in roomCollector)
                {
                    if (elem is Room room)
                    {
                        var data = new BimElementData
                        {
                            ElementId = room.Id.Value,
                            UniqueId = room.UniqueId,
                            Category = "Room",
                            FamilyName = "Room",
                            TypeName = room.get_Parameter(BuiltInParameter.ELEM_TYPE_PARAM)?.AsValueString() ?? "Room",
                            Name = room.get_Parameter(BuiltInParameter.ROOM_NAME)?.AsString() ?? room.Name,
                            RoomName = room.get_Parameter(BuiltInParameter.ROOM_NAME)?.AsString() ?? room.Name,
                            RoomNumber = room.get_Parameter(BuiltInParameter.ROOM_NUMBER)?.AsString() ?? room.Number,
                            LevelName = GetElementLevelName(doc, room),
                            // In Revit, room.Area is in internal sq ft. Convert to sq meters: sqFt * 0.09290304
                            AreaSqM = Math.Round(room.Area * 0.09290304, 2)
                        };

                        // Extract parameters
                        ExtractElementParameters(room, data);

                        // Also extract standard room parameters
                        var dept = room.get_Parameter(BuiltInParameter.ROOM_DEPARTMENT)?.AsString();
                        if (!string.IsNullOrWhiteSpace(dept)) data.Parameters["Department"] = dept;

                        var occ = room.get_Parameter(BuiltInParameter.ROOM_OCCUPANCY)?.AsString();
                        if (!string.IsNullOrWhiteSpace(occ)) data.Parameters["Occupancy"] = occ;

                        result.Rooms.Add(data);
                    }
                }
            }
            catch (Exception ex)
            {
                result.Warnings.Add($"Error extracting rooms: {ex.Message}");
            }

            // 2. EXTRACT REAL DOORS & CLEAR OPENING DIMENSIONS
            try
            {
                var doorCollector = new FilteredElementCollector(doc)
                    .OfCategory(BuiltInCategory.OST_Doors)
                    .WhereElementIsNotElementType()
                    .ToElements();

                foreach (var elem in doorCollector)
                {
                    if (elem is FamilyInstance door)
                    {
                        var symbol = door.Symbol;
                        var familyName = symbol?.FamilyName ?? "Door";
                        var typeName = symbol?.Name ?? door.Name;

                        // Associated room (FromRoom, ToRoom, or host Room)
                        var assocRoom = door.Room?.Name ?? door.FromRoom?.Name ?? door.ToRoom?.Name ?? "";

                        // Width extraction (check Clear Width, Frame Opening Width, Rough Width, or Width)
                        double widthMm = GetLengthParameterInMm(door, symbol, "Clear Width", "Frame Opening Width", "Rough Width", "Width");
                        double heightMm = GetLengthParameterInMm(door, symbol, "Clear Height", "Height", "Rough Height");

                        var data = new BimElementData
                        {
                            ElementId = door.Id.Value,
                            UniqueId = door.UniqueId,
                            Category = "Door",
                            FamilyName = familyName,
                            TypeName = typeName,
                            Name = $"{familyName} - {typeName}",
                            RoomName = assocRoom,
                            WidthMm = Math.Round(widthMm, 1),
                            HeightMm = Math.Round(heightMm, 1),
                            ClearWidthMm = Math.Round(widthMm, 1),
                            LevelName = GetElementLevelName(doc, door)
                        };

                        ExtractElementParameters(door, data);
                        if (symbol != null) ExtractElementParameters(symbol, data);

                        result.Doors.Add(data);
                    }
                }
            }
            catch (Exception ex)
            {
                result.Warnings.Add($"Error extracting doors: {ex.Message}");
            }

            // 3. EXTRACT EQUIPMENT, TOOLS & SAFETY FIXTURES
            try
            {
                var equipCategories = new List<BuiltInCategory>
                {
                    BuiltInCategory.OST_MechanicalEquipment,
                    BuiltInCategory.OST_ElectricalEquipment,
                    BuiltInCategory.OST_SpecialityEquipment,
                    BuiltInCategory.OST_PlumbingFixtures
                };

                var filter = new ElementMulticategoryFilter(equipCategories);
                var equipCollector = new FilteredElementCollector(doc)
                    .WherePasses(filter)
                    .WhereElementIsNotElementType()
                    .ToElements();

                foreach (var elem in equipCollector)
                {
                    var symbol = (elem as FamilyInstance)?.Symbol;
                    var familyName = symbol?.FamilyName ?? elem.Category?.Name ?? "Equipment";
                    var typeName = symbol?.Name ?? elem.Name;
                    var roomName = (elem as FamilyInstance)?.Room?.Name ?? "";

                    var data = new BimElementData
                    {
                        ElementId = elem.Id.Value,
                        UniqueId = elem.UniqueId,
                        Category = "Equipment",
                        FamilyName = familyName,
                        TypeName = typeName,
                        Name = elem.Name,
                        RoomName = roomName,
                        LevelName = elem.get_Parameter(BuiltInParameter.INSTANCE_REFERENCE_LEVEL_PARAM)?.AsValueString() ?? ""
                    };

                    ExtractElementParameters(elem, data);
                    if (symbol != null) ExtractElementParameters(symbol, data);

                    // Check required tool traceability parameters
                    var hasAssetId = data.Parameters.ContainsKey("AssetID") || data.Parameters.ContainsKey("Mark") || data.Parameters.ContainsKey("Asset Tag");
                    if (!hasAssetId)
                    {
                        data.IsMissingRequiredParameters = true;
                        data.MissingParameterNames.Add("AssetID");
                    }

                    result.Equipment.Add(data);
                }
            }
            catch (Exception ex)
            {
                result.Warnings.Add($"Error extracting equipment: {ex.Message}");
            }

            // 4. EXTRACT LEVELS
            try
            {
                var levelCollector = new FilteredElementCollector(doc)
                    .OfCategory(BuiltInCategory.OST_Levels)
                    .WhereElementIsNotElementType()
                    .ToElements();

                foreach (var lvl in levelCollector)
                {
                    result.Levels.Add(new BimElementData
                    {
                        ElementId = lvl.Id.Value,
                        UniqueId = lvl.UniqueId,
                        Category = "Level",
                        Name = lvl.Name,
                        LevelName = lvl.Name
                    });
                }
            }
            catch (Exception ex)
            {
                result.Warnings.Add($"Error extracting levels: {ex.Message}");
            }

            // Fingerprint
            using (var sha = SHA256.Create())
            {
                var raw = $"{result.DocumentTitle}_{result.Rooms.Count}_{result.Doors.Count}_{result.Equipment.Count}_{DateTime.UtcNow:yyyyMMdd}";
                var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(raw));
                result.DocumentFingerprint = Convert.ToHexString(bytes)[..16];
            }

            return result;
        }

        private static string GetElementLevelName(Document doc, Element elem)
        {
            if (elem == null || doc == null) return string.Empty;

            try
            {
                // 1. Try Element.LevelId
                if (elem.LevelId != null && elem.LevelId != ElementId.InvalidElementId)
                {
                    if (doc.GetElement(elem.LevelId) is Level lvl && !string.IsNullOrWhiteSpace(lvl.Name))
                    {
                        return lvl.Name;
                    }
                }

                // 2. Try common built-in parameters
                var pLevel = elem.get_Parameter(BuiltInParameter.ROOM_LEVEL_ID) ??
                             elem.get_Parameter(BuiltInParameter.FAMILY_LEVEL_PARAM) ??
                             elem.get_Parameter(BuiltInParameter.INSTANCE_REFERENCE_LEVEL_PARAM) ??
                             elem.get_Parameter(BuiltInParameter.SCHEDULE_LEVEL_PARAM);

                if (pLevel != null && pLevel.HasValue)
                {
                    var val = pLevel.AsValueString();
                    if (!string.IsNullOrWhiteSpace(val)) return val;
                    val = pLevel.AsString();
                    if (!string.IsNullOrWhiteSpace(val)) return val;
                    if (pLevel.StorageType == StorageType.ElementId && pLevel.AsElementId() != ElementId.InvalidElementId)
                    {
                        var lvlElem = doc.GetElement(pLevel.AsElementId());
                        if (lvlElem != null && !string.IsNullOrWhiteSpace(lvlElem.Name)) return lvlElem.Name;
                    }
                }

                // 3. Try named lookup parameters
                var namedParam = elem.LookupParameter("Level") ?? elem.LookupParameter("Reference Level");
                if (namedParam != null && namedParam.HasValue)
                {
                    var val = namedParam.AsValueString() ?? namedParam.AsString();
                    if (!string.IsNullOrWhiteSpace(val)) return val;
                }
            }
            catch
            {
                // Fallback gracefully
            }

            return string.Empty;
        }

        private static double GetLengthParameterInMm(Element instance, Element? type, params string[] paramNames)
        {
            foreach (var name in paramNames)
            {
                // Check instance parameter
                var p = instance.LookupParameter(name);
                if (p != null && p.HasValue && p.StorageType == StorageType.Double)
                {
                    // Feet to mm: feet * 304.8
                    var mm = p.AsDouble() * 304.8;
                    if (mm > 0) return mm;
                }

                // Check type parameter
                if (type != null)
                {
                    var tp = type.LookupParameter(name);
                    if (tp != null && tp.HasValue && tp.StorageType == StorageType.Double)
                    {
                        var mm = tp.AsDouble() * 304.8;
                        if (mm > 0) return mm;
                    }
                }
            }

            // Check built-in width/height
            var biWidth = instance.get_Parameter(BuiltInParameter.DOOR_WIDTH) ?? type?.get_Parameter(BuiltInParameter.DOOR_WIDTH) ??
                          instance.get_Parameter(BuiltInParameter.GENERIC_WIDTH) ?? type?.get_Parameter(BuiltInParameter.GENERIC_WIDTH);
            if (biWidth != null && biWidth.HasValue && biWidth.StorageType == StorageType.Double)
            {
                var mm = biWidth.AsDouble() * 304.8;
                if (mm > 0) return mm;
            }

            return 0.0;
        }

        private static void ExtractElementParameters(Element elem, BimElementData data)
        {
            foreach (Parameter p in elem.Parameters)
            {
                if (!p.HasValue) continue;
                var defName = p.Definition?.Name;
                if (string.IsNullOrWhiteSpace(defName)) continue;

                if (!data.Parameters.ContainsKey(defName))
                {
                    string strVal;
                    if (p.StorageType == StorageType.String)
                    {
                        strVal = p.AsString();
                    }
                    else
                    {
                        strVal = p.AsValueString() ?? p.AsDouble().ToString();
                    }

                    if (!string.IsNullOrWhiteSpace(strVal))
                    {
                        data.Parameters[defName] = strVal;
                    }
                }
            }
        }
    }

    public static class RevitElementHighlighter
    {
        public static bool HighlightAndZoomElement(UIDocument uiDoc, long elementId)
        {
            if (uiDoc == null) return false;
            try
            {
                var doc = uiDoc.Document;
                var elemId = new ElementId(elementId);
                var element = doc.GetElement(elemId);
                if (element == null)
                {
                    TaskDialog.Show("Element Not Found", $"Revit Element ID {elementId} could not be resolved in the active document. It may have been deleted or moved.");
                    return false;
                }

                uiDoc.Selection.SetElementIds(new List<ElementId> { elemId });
                uiDoc.ShowElements(elemId);
                return true;
            }
            catch (Exception ex)
            {
                TaskDialog.Show("Highlight Error", $"Failed to highlight element: {ex.Message}");
                return false;
            }
        }

        public static bool IsolateElementTemporary(UIDocument uiDoc, long elementId)
        {
            if (uiDoc == null) return false;
            try
            {
                var doc = uiDoc.Document;
                var view = doc.ActiveView;
                var elemId = new ElementId(elementId);
                using var trans = new Transaction(doc, "EASA Temporary Isolation");
                trans.Start();
                view.IsolateElementsTemporary(new List<ElementId> { elemId });
                trans.Commit();
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
