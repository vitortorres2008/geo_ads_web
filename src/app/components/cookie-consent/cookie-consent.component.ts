import { Component, OnInit } from '@angular/core';
import { CookieService } from '../../services/cookie.service';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';

@Component({
    standalone: true,
  selector: 'app-cookie-consent',
  templateUrl: './cookie-consent.component.html',
  styleUrls: ['./cookie-consent.component.css'],
  imports: [CommonModule],
})
export class CookieConsentComponent implements OnInit {
  showConsent = false;

  constructor(private cookieService: CookieService) {}

  ngOnInit(): void {
    this.showConsent = !this.cookieService.hasConsent();
  }

  acceptCookies(): void {
    this.cookieService.setConsent(true);
    this.showConsent = false;
  }
  rejectCookies(): void {
    this.cookieService.setConsent(false);
    this.showConsent = false;
  }

  downloadPrivacyPolicy(): void {
    this.generatePrivacyPolicyPDF();
  }
  private generatePrivacyPolicyPDF(): void {
    const doc = new jsPDF();
    
    // Configurações do PDF
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('POLÍTICA DE PRIVACIDADE', 20, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Última atualização: 01 de Janeiro de 2025', 20, 30);
    
    let y = 45;
    const lineHeight = 6;
    const pageHeight = 280;
    const margin = 20;
    const maxWidth = 170;
    
    const sections = this.getPrivacyPolicySections();
    
    sections.forEach(section => {
      // Verificar se precisa de nova página
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }
      
      // Título da seção
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const titleLines = doc.splitTextToSize(section.title, maxWidth);
      titleLines.forEach((line: string) => {
        doc.text(line, margin, y);
        y += lineHeight;
      });
      y += 2;
      
      // Conteúdo da seção
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const contentLines = doc.splitTextToSize(section.content, maxWidth);
      contentLines.forEach((line: string) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });
      y += 5;
    });
    
    // Rodapé
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('© 2025 Prospect Project. Todos os direitos reservados.', margin, y);
    doc.text('By Towers Company.', margin, y + 8);
      // Abrir PDF em nova aba
    const pdfOutput = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfOutput);
    window.open(pdfUrl, '_blank');
  }
  private getPrivacyPolicySections(): { title: string; content: string }[] {
    return [
      {
        title: '1. INTRODUÇÃO',
        content: 'Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações pessoais quando você utiliza nossa aplicação de prospecção de clientes.'
      },
      {
        title: '2. INFORMAÇÕES QUE COLETAMOS',
        content: '2.1 Informações Fornecidas por Você\n• Nome e informações de contato\n• Informações da empresa\n• Dados de pesquisa e consultas realizadas\n\n2.2 Informações Coletadas Automaticamente\n• Endereço IP\n• Tipo de navegador e dispositivo\n• Páginas visitadas e tempo de permanência\n• Cookies e tecnologias similares'
      },
      {
        title: '3. COMO USAMOS SUAS INFORMAÇÕES',
        content: '• Fornecer e melhorar nossos serviços\n• Personalizar sua experiência\n• Comunicar-nos com você sobre atualizações e novidades\n• Analisar o uso da plataforma para melhorias\n• Cumprir obrigações legais'
      },
      {
        title: '4. COMPARTILHAMENTO DE INFORMAÇÕES',
        content: 'Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto nas seguintes situações:\n• Com seu consentimento explícito\n• Para cumprir obrigações legais\n• Para proteger nossos direitos e segurança\n• Com prestadores de serviços que nos auxiliam na operação da plataforma'
      },
      {
        title: '5. COOKIES',
        content: 'Utilizamos cookies para melhorar sua experiência em nosso site. Os cookies nos ajudam a:\n• Lembrar suas preferências\n• Analisar o tráfego do site\n• Personalizar conteúdo\n• Fornecer funcionalidades essenciais\n\nVocê pode controlar o uso de cookies através das configurações do seu navegador.'
      },
      {
        title: '6. SEGURANÇA DOS DADOS',
        content: 'Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.'
      },
      {
        title: '7. RETENÇÃO DE DADOS',
        content: 'Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos nesta política, salvo quando a retenção por período mais longo for exigida ou permitida por lei.'
      },
      {
        title: '8. SEUS DIREITOS',
        content: 'Você tem o direito de:\n• Acessar suas informações pessoais\n• Corrigir dados incorretos ou desatualizados\n• Solicitar a exclusão de suas informações\n• Restringir o processamento de seus dados\n• Portabilidade dos dados\n• Retirar seu consentimento a qualquer momento'
      },
      {
        title: '9. MENORES DE IDADE',
        content: 'Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente informações pessoais de menores de idade.'
      },
      {
        title: '10. ALTERAÇÕES NESTA POLÍTICA',
        content: 'Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas através de nosso site ou por email.'
      },
      {
        title: '11. CONTATO',
        content: 'Se você tiver dúvidas sobre esta Política de Privacidade ou sobre o tratamento de seus dados pessoais, entre em contato conosco:\n\nEmail: cefetcnita@gmail.com\nTelefone: (21) 96474-3581\nEndereço: Rua Adolfo Antônio Gouveia - Seropédica - Rio de Janeiro - Brasil'
      }
    ];
  }
}