from pathlib import Path
from io import BytesIO
from xml.sax.saxutils import escape
import re,textwrap
from PIL import Image as PILImage
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,Table,TableStyle,Image,Preformatted,KeepTogether,Flowable
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY,TA_CENTER
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from pypdf import PdfReader
ROOT=Path.cwd(); OUT=ROOT/'output/pdf';OUT.mkdir(parents=True,exist_ok=True)
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyPT',fontName='Times-Roman',fontSize=11,leading=15,alignment=TA_JUSTIFY,spaceAfter=8))
styles.add(ParagraphStyle(name='TitlePT',fontName='Times-Bold',fontSize=15,leading=20,alignment=TA_CENTER,spaceAfter=18))
styles.add(ParagraphStyle(name='HeadPT',fontName='Times-Bold',fontSize=13,leading=17,spaceBefore=14,spaceAfter=9,keepWithNext=True))
styles.add(ParagraphStyle(name='CellPT',fontName='Times-Roman',fontSize=8.5,leading=11))
styles.add(ParagraphStyle(name='CaptionPT',fontName='Times-Roman',fontSize=9,leading=12,spaceAfter=12))
styles.add(ParagraphStyle(name='CodePT',fontName='Courier',fontSize=8,leading=10))
W=A4[0]-4*cm
story=[]
def para(t,style='BodyPT'):return Paragraph(escape(t).replace('\n','<br/>'),styles[style])
story += [Spacer(1,2*cm),para('ENGENHARIA DE SOFTWARE - 2026.2','TitlePT'),Spacer(1,2*cm),para('SISTEMA DE GERENCIAMENTO DE EVENTOS CIENTÍFICOS USANDO MICROSSERVIÇOS E COMPONENTES DE SOFTWARE','TitlePT'),Spacer(1,2*cm),para('Arthur Carvalho e Ana Leticia Nobre','TitlePT'),Spacer(1,2*cm),para('Repositório do projeto:','TitlePT'),para('https://github.com/arthuurca/projeto_Engenharia_de_software'),Spacer(1,2*cm),para('2026.2','TitlePT'),PageBreak()]
class Architecture(Flowable):
    def __init__(self):Flowable.__init__(self);self.width=W;self.height=180
    def draw(self):
        c=self.canv;c.setStrokeColor(colors.black);c.setFillColor(colors.black)
        def box(x,y,w,h,title):
            c.rect(x,y,w,h);c.setFont('Helvetica',9);c.drawCentredString(x+w/2,y+h/2-3,title)
        box(W/2-85,146,170,25,'Interface web');box(W/2-85,99,170,25,'API Gateway :3000')
        c.line(W/2,146,W/2,124);c.line(W/2,124,W/2-3,130);c.line(W/2,124,W/2+3,130)
        for i,title in enumerate(['Usuários','Eventos','Inscrições','Recomendações']):
            x=i*W/4;box(x+3,45,W/4-6,27,title+' :'+str(3001+i));c.line(W/2,99,x+W/8,72);c.line(x+W/8,72,x+W/8-3,78);c.line(x+W/8,72,x+W/8+3,78)
            if i<3:
                box(x+3,0,W/4-6,24,'SQLite próprio');c.line(x+W/8,45,x+W/8,24)

def table(block):
    rows=[r for r in block.splitlines() if r.startswith('|') and not re.fullmatch(r'[| :\-]+',r)]
    data=[[para(v.strip(),'CellPT') for v in row.split('|')[1:-1]] for row in rows]
    n=len(data[0]); widths=([.12,.52,.36] if n==3 else [.17,.43,.20,.20] if n==4 else [.17,.83])
    t=Table(data,colWidths=[W*v for v in widths],repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('GRID',(0,0),(-1,-1),.4,colors.black),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
    return t
text=(ROOT/'relatorio.txt').read_text(encoding='utf-8-sig')
text=text[text.index('1. APRESENTAÇÃO'):]
text=text.split('ATUALIZAÇÃO DA ENTREGA:')[0]
text=text.replace('Essa divisão representa o planejamento; os registros técnicos descrevem os resultados observados sem afirmar reuniões ou retrospectivas que não foram registradas.','A divisão serviu como referência para organizar as tarefas e acompanhar os resultados.')
text=text.replace('O código completo acompanha o repositório e o anexo da versão HTML deste relatório.','O código completo está no repositório. Os códigos solicitados pelo professor estão no Anexo B deste relatório.')
text=text.replace('A cópia visual deste relatório, relatorio.html, incorpora as capturas para consulta sem depender de um site externo.','As capturas estão reunidas no Anexo A.')
for block in re.split(r'\n\s*\n',text):
    block=block.strip().replace('—','-').replace('–','-')
    if not block:continue
    if block.startswith('Navegador ('):story += [Architecture(),para('Chamadas internas por HTTP: Inscrições → Usuários e Eventos; Eventos → Inscrições (ocupação); Recomendações → Usuários, Eventos e Inscrições. Cada seta do diagrama parte do chamador. As respostas retornam pela mesma conexão.'),Spacer(1,12)];continue
    if block.startswith('|'):story += [table(block),Spacer(1,10)];continue
    if re.match(r'^\d+\. [A-ZÁÉÍÓÚÇ]',block):
        story.append(para(block,'HeadPT'))
        if block.startswith('3.'):
            story.append(para('No projeto, aplicamos reuso por meio dos microsserviços e dos componentes de formulário, cartão de evento e comunicação com a API.'))
        if block.startswith('4.'):
            story.append(para('O reuso acompanhou as etapas de desenvolvimento. Na primeira sprint, criamos os campos dos cadastros e o cliente de API compartilhado. Na segunda, reutilizamos o cartão de evento nas inscrições e recomendações. Na revisão final, conferimos a integração e documentamos as responsabilidades desses componentes.'))
        continue
    if block.startswith('python/common.py'):
        story += [para('Sistema de recomendação','HeadPT'),para('O serviço executa os seguintes passos: 1) consulta a área de interesse do participante; 2) consulta os eventos e suas vagas; 3) obtém os eventos em que o participante já está inscrito; 4) seleciona eventos futuros da mesma área, com vagas e sem inscrição prévia; 5) ordena pelo início e pelo identificador. Se não houver resultados, retorna uma lista vazia. Uma falha de comunicação gera uma mensagem de erro.')]
    story.append(para(block))
# Capturas documentais: recortes da mesma evidência, sem alterar os dados apresentados.
original=PILImage.open(ROOT/'docs/evidencias/python-interface-integrada.png').convert('L')
story += [PageBreak(),para('ANEXO A - TELAS DO SISTEMA','HeadPT')]
regions=[('Figura 1 - Painel com os quatro microsserviços online.',(75,280,1190,480)),('Figura 2 - Cadastro e seleção do participante.',(80,1740,630,2630)),('Figura 3 - Cadastro de evento.',(640,1740,1190,2630)),('Figura 4 - Programação e confirmação da inscrição.',(80,490,1190,1120)),('Figura 5 - Consulta das inscrições do participante.',(80,1130,1190,1615)),('Figura 6 - Evento recomendado antes da inscrição.',(80,1250,1190,1790))]
for label,rect in regions:
    source=PILImage.open(ROOT/'docs/evidencias/python-antes-inscricao.png').convert('L') if label.startswith('Figura 6') else original
    im=source.crop(rect); buf=BytesIO();im.save(buf,format='PNG');buf.seek(0)
    width=min(W,360 if im.height>im.width else W);height=width*im.height/im.width
    story.append(KeepTogether([para(label,'CaptionPT'),Image(buf,width=width,height=height),Spacer(1,16)]))

# Página inteira com identificação visual do painel, preservando a captura original.
class MarkedScreen(Flowable):
    def __init__(self): Flowable.__init__(self);self.width=W;self.height=640
    def draw(self):
        c=self.canv;scale=min(W/original.width,630/original.height)
        w,h=original.width*scale,original.height*scale
        buf=BytesIO();original.save(buf,format='PNG');buf.seek(0)
        from reportlab.lib.utils import ImageReader
        c.drawImage(ImageReader(buf),0,0,width=w,height=h)
        c.setLineWidth(2);c.rect(75*scale,(original.height-480)*scale,1115*scale,200*scale)
        c.setFont('Helvetica-Bold',9);c.drawString(w+5,h-330*scale,'Painel dos serviços')
story += [PageBreak(),para('Figura 7 - Página inteira com o painel de microsserviços destacado.','CaptionPT'),MarkedScreen()]

story += [PageBreak(),para('ANEXO B - CÓDIGOS SOLICITADOS','HeadPT'),para('Este anexo reúne o código do Gateway, dos microsserviços, da recomendação e dos componentes reutilizáveis, conforme os itens 6.2, 6.3 e 6.4 das orientações. A descrição das responsabilidades está na seção 7. Os demais arquivos e as instruções de execução estão no repositório.')]
files=['python/gateway/app.py','python/services/usuarios/app.py','python/services/eventos/app.py','python/services/inscricoes/app.py','python/services/recomendacoes/app.py','python/common.py','python/shared.py','frontend/components/field.js','frontend/components/event-card.js','frontend/api.js']
for file in files:
    story.append(para(file,'HeadPT'))
    code=(ROOT/file).read_text(encoding='utf-8-sig').replace('—','-')
    lines=[]
    for line in code.splitlines():
        lines.extend(textwrap.wrap(line.expandtabs(4),width=90,subsequent_indent='    ',replace_whitespace=False,drop_whitespace=False) or [''])
    for offset in range(0,len(lines),28):
        story.append(Preformatted('\n'.join(lines[offset:offset+28]),styles['CodePT']))
def footer(c,doc):
    c.setFillColor(colors.black);c.setFont('Times-Roman',9)
    if doc.page>1:c.drawCentredString(A4[0]/2,1.2*cm,str(doc.page-1))
path=OUT/'relatorio-projeto-eventos-cientificos.pdf'
SimpleDocTemplate(str(path),pagesize=A4,rightMargin=2*cm,leftMargin=2*cm,topMargin=2*cm,bottomMargin=2*cm,title='Sistema de Gerenciamento de Eventos Científicos',author='Arthur Carvalho e Ana Leticia Nobre').build(story,onFirstPage=footer,onLaterPages=footer)
reader=PdfReader(path);print(str(path));print('Páginas:',len(reader.pages))
