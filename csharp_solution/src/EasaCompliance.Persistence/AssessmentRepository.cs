using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using EasaCompliance.Core.Models;

namespace EasaCompliance.Persistence.Services
{
    public class AssessmentRepository
    {
        private readonly string _connectionString;

        public AssessmentRepository(string databasePath = "EasaAssessmentHistory.db")
        {
            _connectionString = $"Data Source={databasePath}";
        }

        public async Task InitializeDatabaseAsync()
        {
            using var conn = new SqliteConnection(_connectionString);
            await conn.OpenAsync();
            var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                CREATE TABLE IF NOT EXISTS AssessmentProjects (
                    ProjectId TEXT PRIMARY KEY,
                    ProjectName TEXT NOT NULL,
                    FacilityName TEXT NOT NULL,
                    CountryOfOperation TEXT,
                    AssessmentDate TEXT,
                    ModelFingerprint TEXT
                );
                CREATE TABLE IF NOT EXISTS Findings (
                    FindingId TEXT PRIMARY KEY,
                    ProjectId TEXT NOT NULL,
                    RegulatoryReference TEXT NOT NULL,
                    Status TEXT NOT NULL,
                    Severity TEXT NOT NULL,
                    Description TEXT NOT NULL
                );";
            await cmd.ExecuteNonQueryAsync();
        }

        public async Task SaveProjectAsync(AssessmentProject project)
        {
            using var conn = new SqliteConnection(_connectionString);
            await conn.OpenAsync();
            var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                INSERT OR REPLACE INTO AssessmentProjects 
                (ProjectId, ProjectName, FacilityName, CountryOfOperation, AssessmentDate, ModelFingerprint)
                VALUES ($id, $name, $fac, $country, $date, $hash);";
            cmd.Parameters.AddWithValue("$id", project.ProjectId);
            cmd.Parameters.AddWithValue("$name", project.ProjectName);
            cmd.Parameters.AddWithValue("$fac", project.FacilityName);
            cmd.Parameters.AddWithValue("$country", project.CountryOfOperation);
            cmd.Parameters.AddWithValue("$date", project.AssessmentDate.ToString("o"));
            cmd.Parameters.AddWithValue("$hash", project.ModelFingerprint);
            await cmd.ExecuteNonQueryAsync();
        }
    }
}
