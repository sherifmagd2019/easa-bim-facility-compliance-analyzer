using System.Collections.Generic;
using System.Threading.Tasks;
using EasaCompliance.Core.Models;

namespace EasaCompliance.Bim.Services
{
    public interface IBimExtractionService
    {
        Task<BimExtractionResult> ExtractModelDataAsync();
        ModelCompletenessReport EvaluateCompleteness(BimExtractionResult data);
    }
}
