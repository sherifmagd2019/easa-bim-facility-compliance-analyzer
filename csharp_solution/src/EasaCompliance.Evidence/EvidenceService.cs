using System;
using System.Collections.Generic;
using System.Linq;
using EasaCompliance.Core.Enums;
using EasaCompliance.Core.Models;

namespace EasaCompliance.Evidence.Services
{
    public class EvidenceManager
    {
        private readonly List<EvidenceItem> _evidenceItems = new();
        private readonly List<CorrectiveAction> _correctiveActions = new();

        public IReadOnlyList<EvidenceItem> EvidenceItems => _evidenceItems.AsReadOnly();
        public IReadOnlyList<CorrectiveAction> CorrectiveActions => _correctiveActions.AsReadOnly();

        public void RegisterEvidence(EvidenceItem item)
        {
            if (string.IsNullOrWhiteSpace(item.Title))
                throw new ArgumentException("Evidence title cannot be empty", nameof(item));
            _evidenceItems.Add(item);
        }

        public CorrectiveAction CreateCorrectiveAction(
            string findingId,
            string description,
            string responsiblePerson,
            DateTime targetDate,
            string requiredEvidence,
            string verificationMethod)
        {
            var action = new CorrectiveAction
            {
                FindingId = findingId,
                Description = description,
                ResponsiblePerson = responsiblePerson,
                TargetDate = targetDate,
                Status = CorrectiveActionStatus.Open,
                RequiredCompletionEvidence = requiredEvidence,
                VerificationMethod = verificationMethod
            };
            _correctiveActions.Add(action);
            return action;
        }

        public bool CloseAction(string actionId, string reviewer, string retestResult)
        {
            var action = _correctiveActions.FirstOrDefault(a => a.ActionId == actionId);
            if (action == null) return false;

            action.Status = CorrectiveActionStatus.VerifiedClosed;
            action.ClosureReviewer = reviewer;
            action.ClosureDate = DateTime.UtcNow;
            action.RetestResult = retestResult;
            return true;
        }
    }
}
