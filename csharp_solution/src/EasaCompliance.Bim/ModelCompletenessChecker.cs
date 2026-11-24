using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using EasaCompliance.Core.Models;

namespace EasaCompliance.Bim.Services
{
    public class ModelCompletenessChecker
    {
        public static ModelCompletenessReport CheckCompleteness(BimExtractionResult result)
        {
            var report = new ModelCompletenessReport
            {
                RoomsInspected = result.Rooms.Count,
                DoorsInspected = result.Doors.Count,
                EquipmentInspected = result.Equipment.Count,
                ElementsInspected = result.Rooms.Count + result.Doors.Count + result.Equipment.Count + result.Walls.Count
            };

            foreach (var r in result.Rooms)
            {
                if (string.IsNullOrWhiteSpace(r.RoomName) || r.RoomName.StartsWith("Room", StringComparison.OrdinalIgnoreCase))
                {
                    report.UnidentifiedRooms.Add($"Room #{r.RoomNumber}: Name is '{r.RoomName}' (unassigned function)");
                }
            }

            foreach (var eq in result.Equipment)
            {
                var hasId = eq.Parameters.ContainsKey("AssetID") || eq.Parameters.ContainsKey("Mark") || eq.Parameters.ContainsKey("Serial");
                if (!hasId)
                {
                    report.UnidentifiedEquipment.Add($"Equipment '{eq.Name}' (ID {eq.ElementId}): Missing AssetID/Mark");
                    report.MissingRequiredParameterCount++;
                }
            }

            foreach (var d in result.Doors)
            {
                if (d.ClearWidthMm <= 0 && d.WidthMm <= 0)
                {
                    report.IncompleteChecks.Add($"Door '{d.Name}' (ID {d.ElementId}): Clear opening dimensions missing");
                    report.MissingRequiredParameterCount++;
                }
            }

            var totalChecks = Math.Max(1, report.ElementsInspected);
            var defectPenalty = (report.UnidentifiedRooms.Count * 2) + report.MissingRequiredParameterCount;
            var rawScore = 100.0 - ((double)defectPenalty / totalChecks * 50.0);
            report.OverallCompletenessScore = Math.Round(Math.Clamp(rawScore, 10.0, 100.0), 1);
            report.ModelLimitations.Add("Door clear widths calculated from instance/type parameters; threshold adjustments require site physical measurement.");
            report.ModelLimitations.Add("Non-geometric HVAC air exchange rates and particulate filtration classes cannot be inferred from standard architectural geometry.");

            return report;
        }

        public static string ComputeFingerprint(string text)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(text));
            return Convert.ToHexString(bytes)[..16];
        }
    }
}
