// src/components/pos/ReceiptPrinter.tsx
import { TransactionDTO } from '@/types/entities';
import { CustomPaymentResponse } from '@/hooks/usePOS';

export class ReceiptPrinter {
  static printTicket(transactionData: CustomPaymentResponse | TransactionDTO) {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Ticket - ${transactionData.numeroTicket}</title>
          <style>
            @page { size: 80mm auto; margin: 5mm; }
            @media print { 
              body { margin: 0; -webkit-print-color-adjust: exact; } 
              .no-print { display: none; }
            }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              line-height: 1.4;
              margin: 0;
              padding: 5mm;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .separator { 
              border-top: 1px dashed #000; 
              margin: 8px 0; 
            }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 2px 0; vertical-align: top; }
            .right { text-align: right; }
            .total-line { 
              border-top: 1px solid #000; 
              font-weight: bold; 
            }
          </style>
        </head>
        <body>
          <div class="center bold">
            ===============================<br>
            🍽️ CANTINE ENTREPRISE 🍽️<br>
            ===============================
          </div>
          <div class="separator"></div>
          <div>
            <strong>Ticket N°:</strong> ${transactionData.numeroTicket}<br>
            <strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}<br>
            <strong>Heure:</strong> ${new Date().toLocaleTimeString('fr-FR')}<br>
            <strong>Client:</strong> ${transactionData.utilisateurEmail || 'Client POS'}<br>
            <strong>Terminal:</strong> POS-WEB-001
          </div>
          <div class="separator"></div>
          <div class="bold">DÉTAIL DES ARTICLES:</div>
          <table>
            ${transactionData.articles?.map((article: any) => `
              <tr>
                <td>${article.nom} x${article.quantite || 1}</td>
                <td class="right">${article.montantTotal?.toFixed(2) || (parseFloat(article.prix || '0') * (article.quantite || 1)).toFixed(2)} MAD</td>
              </tr>
              <tr>
                <td style="font-size: 10px; color: #666;">
                  Prix unit: ${article.prixUnitaire?.toFixed(2) || parseFloat(article.prix || '0').toFixed(2)} MAD | Subv: ${article.subventionTotale?.toFixed(2) || '0.00'} MAD
                </td>
                <td class="right" style="font-size: 10px; color: #666;">
                  Votre part: ${article.partSalariale?.toFixed(2) || '0.00'} MAD
                </td>
              </tr>
            `).join('') || '<tr><td colspan="2">Détails non disponibles</td></tr>'}
          </table>
          <div class="separator"></div>
          <table>
            <tr>
              <td>Sous-total:</td>
              <td class="right">${transactionData.montantTotal?.toFixed(2) || '0.00'} MAD</td>
            </tr>
            <tr>
              <td>Subvention entreprise:</td>
              <td class="right">-${transactionData.partPatronale?.toFixed(2) || '0.00'} MAD</td>
            </tr>
            <tr class="total-line">
              <td><strong>MONTANT DÉBITÉ:</strong></td>
              <td class="right"><strong>${transactionData.partSalariale?.toFixed(2) || '0.00'} MAD</strong></td>
            </tr>
          
          </table>
          <div class="separator"></div>
          <div class="center">
            ✅ Montant débité de votre badge<br>
            ${(transactionData.partPatronale || 0) > 0 ? `🎯 Vous avez économisé ${transactionData.partPatronale?.toFixed(2)} MAD !` : ''}<br><br>
            Merci et bon appétit !<br>
            💚 EasyPOS Cantine 💚
          </div>
          <div class="center">===============================</div>
          
          <div class="no-print center" style="margin-top: 20px;">
            <button onclick="window.print()" style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
              🖨️ Imprimer
            </button>
            <button onclick="window.close()" style="background: #6b7280; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
              Fermer
            </button>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      // Auto-print après un court délai
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }

  static generateTicketContent(transactionData: CustomPaymentResponse): string {
    return `
=================================
       CANTINE ENTREPRISE
=================================

Ticket N°: ${transactionData.numeroTicket}
Date: ${new Date().toLocaleDateString('fr-FR')}
Heure: ${new Date().toLocaleTimeString('fr-FR')}
Client: ${transactionData.utilisateurNomComplet}

---------------------------------
DÉTAIL DES ARTICLES:

${transactionData.articles?.map(article => 
  `${article.nom} x${article.quantite}
  Prix: ${article.prixUnitaire?.toFixed(2)} MAD | Total: ${article.montantTotal?.toFixed(2)} MAD
  Subvention: ${article.subventionTotale?.toFixed(2)} MAD | Votre part: ${article.partSalariale?.toFixed(2)} MAD`
).join('\n\n') || 'Détails non disponibles'}

---------------------------------
RÉSUMÉ:
Sous-total: ${transactionData.montantTotal?.toFixed(2)} MAD
Subvention entreprise: -${transactionData.partPatronale?.toFixed(2)} MAD
MONTANT DÉBITÉ: ${transactionData.partSalariale?.toFixed(2)} MAD
Nouveau solde: ${transactionData.nouveauSolde?.toFixed(2)} MAD

---------------------------------
✅ Montant débité de votre badge
${(transactionData.partPatronale || 0) > 0 ? `🎯 Économie: ${transactionData.partPatronale?.toFixed(2)} MAD` : ''}

Merci et bon appétit !
💚 EasyPOS Cantine 💚
=================================
    `;
  }
}