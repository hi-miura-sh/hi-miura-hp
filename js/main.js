window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 10) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// BibTeXパーサー
class BibTeXParser {
    constructor() {
        this.publications = [];
    }

    async loadBibTeX() {
        try {
            const response = await fetch('publications.bib');
            const bibText = await response.text();
            this.parseBibTeX(bibText);
            return this.publications;
        } catch (error) {
            console.error('BibTeXファイルの読み込みに失敗しました:', error);
            return [];
        }
    }

    parseBibTeX(bibText) {
        this.publications = [];
        
        if (!bibText || typeof bibText !== 'string') {
            console.error('Invalid bibText:', bibText);
            return;
        }
        
        // BibTeXエントリを抽出
        const entries = bibText.split(/@\w+\s*{/).slice(1);
        
        entries.forEach(entry => {
            if (!entry || typeof entry !== 'string') {
                console.warn('Invalid entry:', entry);
                return;
            }
            
            const lines = entry.split('\n');
            const firstLine = lines[0].trim();
            
            // エントリの種類とキーを安全に抽出
            const typeMatch = firstLine.match(/^(\w+),/);
            const keyMatch = firstLine.match(/^(\w+),/);
            
            if (!typeMatch || !keyMatch) {
                console.warn('Invalid BibTeX entry format:', firstLine);
                return;
            }
            
            const type = typeMatch[1];
            const key = keyMatch[1];
            
            const fields = {};
            let currentField = '';
            let currentValue = '';
            let braceCount = 0;
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                
                if (line.includes('=')) {
                    // 新しいフィールド
                    if (currentField) {
                        fields[currentField] = this.cleanValue(currentValue);
                    }
                    
                    const parts = line.split('=');
                    currentField = parts[0].trim();
                    currentValue = parts.slice(1).join('=').trim();
                    
                    // 中括弧の数をカウント
                    braceCount = (currentValue.match(/\{/g) || []).length - (currentValue.match(/\}/g) || []).length;
                    
                    if (braceCount === 0 && currentValue.endsWith(',')) {
                        fields[currentField] = this.cleanValue(currentValue.slice(0, -1));
                        currentField = '';
                        currentValue = '';
                    }
                } else if (currentField) {
                    currentValue += ' ' + line;
                    braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
                    
                    if (braceCount === 0 && line.endsWith(',')) {
                        fields[currentField] = this.cleanValue(currentValue.slice(0, -1));
                        currentField = '';
                        currentValue = '';
                    }
                }
            }
            
            if (currentField) {
                fields[currentField] = this.cleanValue(currentValue);
            }
            
            console.log(`Parsed publication: ${key}, fields:`, fields);
            this.publications.push({
                type: type,
                key: key,
                fields: fields
            });
        });
        
        // 年でソート（新しい順）
        this.publications.sort((a, b) => {
            const yearA = parseInt(a.fields.year) || 0;
            const yearB = parseInt(b.fields.year) || 0;
            return yearB - yearA;
        });
    }

    cleanValue(value) {
        if (!value) return '';
        
        return value
            .replace(/^\{+|\}+$/g, '') // 先頭と末尾の中括弧を複数回削除
            .replace(/^["']|["']$/g, '') // 引用符を削除
            .replace(/\s+/g, ' ') // 複数の空白を1つに
            .replace(/\n/g, ' ') // 改行を空白に
            .trim();
    }

    formatPublication(pub, index) {
        const rawAuthors = this.cleanValue(pub.fields.author || '');
        const title = this.cleanValue(pub.fields.title || '');
        const journal = this.cleanValue(pub.fields.journal || '');
        const booktitle = this.cleanValue(pub.fields.booktitle || '');
        const conferenceInfo = journal || booktitle;
        const year = this.cleanValue(pub.fields.year || '');
        const volume = this.cleanValue(pub.fields.volume || '');
        const number = this.cleanValue(pub.fields.number || '');
        const pages = this.cleanValue(pub.fields.pages || '');
        const note = this.cleanValue(pub.fields.note || '');
        const doi = this.cleanValue(pub.fields.doi || '');
        const url = this.cleanValue(pub.fields.url || '');
        
        // 日本語の著者名を適切に処理
        let authors = rawAuthors;
        if (rawAuthors.includes('三浦') || rawAuthors.includes('木村') || rawAuthors.includes('平田') || 
            rawAuthors.includes('加重') || rawAuthors.includes('橘') || rawAuthors.includes('宇野') ||
            rawAuthors.includes('狭間') || rawAuthors.includes('石川') || rawAuthors.includes('伊藤') ||
            rawAuthors.includes('虻川') || rawAuthors.includes('三杉') || rawAuthors.includes('金子') ||
            rawAuthors.includes('西本') || rawAuthors.includes('坂本') || rawAuthors.includes('田淵') ||
            rawAuthors.includes('鎌村') || rawAuthors.includes('常松')) {
            // 日本語の場合は「and」を「，」に置換
            authors = rawAuthors.replace(/\s+and\s+/g, '，');
            // 先頭と末尾の「，」を削除
            authors = authors.replace(/^，+|，+$/g, '').trim();
        } else {
            // 英語の場合は「H. Miura」形式に変換
            // BibTeX形式（Last, First）を処理
            if (rawAuthors.includes(',')) {
                // BibTeX形式の場合: "Misugi, Hyoryu and Miura, Hideyoshi and Hirata, Kouji and Tachibana, Takushi"
                const authorPairs = rawAuthors.split(/\s+and\s+/);
                const convertedAuthors = authorPairs.map(pair => {
                    const trimmed = pair.trim();
                    if (trimmed.includes(',')) {
                        const [lastName, firstName] = trimmed.split(',').map(s => s.trim());
                        const firstInitial = firstName.charAt(0).toUpperCase();
                        return `${firstInitial}. ${lastName}`;
                    }
                    return trimmed; // フォールバック
                });
                
                // 英語の文法に従って結合（最後の前に"and"を追加）
                if (convertedAuthors.length === 1) {
                    authors = convertedAuthors[0];
                } else if (convertedAuthors.length === 2) {
                    authors = `${convertedAuthors[0]} and ${convertedAuthors[1]}`;
                } else {
                    const lastAuthor = convertedAuthors.pop();
                    authors = `${convertedAuthors.join(', ')}, and ${lastAuthor}`;
                }
            } else if (rawAuthors.includes(' and ') && !rawAuthors.includes(',')) {
                // {Author1 and Author2 and Author3}形式の場合: "Hideyoshi Miura and Tomotaka Kimura and Hirohisa Aman and Kouji Hirata"
                const authorNames = rawAuthors.split(/\s+and\s+/);
                const convertedAuthors = authorNames.map(name => {
                    const trimmed = name.trim();
                    const nameParts = trimmed.split(' ');
                    if (nameParts.length >= 2) {
                        const firstName = nameParts[0];
                        const lastName = nameParts[nameParts.length - 1];
                        const firstInitial = firstName.charAt(0).toUpperCase();
                        return `${firstInitial}. ${lastName}`;
                    }
                    return trimmed; // フォールバック
                });
                
                // 英語の文法に従って結合（最後の前に"and"を追加）
                if (convertedAuthors.length === 1) {
                    authors = convertedAuthors[0];
                } else if (convertedAuthors.length === 2) {
                    authors = `${convertedAuthors[0]} and ${convertedAuthors[1]}`;
                } else {
                    const lastAuthor = convertedAuthors.pop();
                    authors = `${convertedAuthors.join(', ')}, and ${lastAuthor}`;
                }
            } else {
                // 通常の英語表記の場合
                authors = rawAuthors
                    .replace(/Hideyoshi Miura/g, 'H. Miura')
                    .replace(/Tomotaka Kimura/g, 'T. Kimura')
                    .replace(/Kouji Hirata/g, 'K. Hirata')
                    .replace(/Hyoryu Misugi/g, 'H. Misugi')
                    .replace(/Hiroshi Aman/g, 'H. Aman')
                    .replace(/Takushi Tachibana/g, 'T. Tachibana')
                    .replace(/Mikoto Tsunematsu/g, 'M. Tsunematsu')
                    .replace(/Katsunori Uno/g, 'K. Uno')
                    .replace(/Shoya Abukawa/g, 'S. Abukawa')
                    .replace(/Yuto Hazama/g, 'Y. Hazama')
                    .replace(/Ryo Kaneko/g, 'R. Kaneko')
                    .replace(/Kentaro Kaju/g, 'K. Kaju')
                    .replace(/Shogo Ishikawa/g, 'S. Ishikawa')
                    .replace(/Yuki Ito/g, 'Y. Ito')
                    .replace(/Takumi Sakamoto/g, 'T. Sakamoto')
                    .replace(/Takumi Tabuchi/g, 'T. Tabuchi')
                    .replace(/Seihei Kamamura/g, 'S. Kamamura')
                    .replace(/Mikoto Tsunematsu/g, 'M. Tsunematsu')
                    .replace(/Rinichiro Nishimoto/g, 'R. Nishimoto');
            }
        }
        
        // ジャーナル名とその他の情報を分離
        let journalName = conferenceInfo;
        let journalDetails = '';
        
        // booktitleに年が含まれているかチェック
        const hasYearInTitle = conferenceInfo && /\d{4}/.test(conferenceInfo);
        
        // volume, number, pages, noteを順番に追加
        if (volume) journalDetails += journalDetails ? `, vol. ${volume}` : `vol. ${volume}`;
        if (number) journalDetails += journalDetails ? `, no. ${number}` : `no. ${number}`;
        if (pages) journalDetails += journalDetails ? `, pp. ${pages}` : `pp. ${pages}`;
        if (note) journalDetails += journalDetails ? `, ${note}` : `${note}`;
        
        // 年の追加（すべてのケースでカンマ+スペース）
        if (year && !hasYearInTitle) {
            journalDetails = journalDetails ? `${journalDetails}, ${year}.` : `${year}.`;
        } else if (year && hasYearInTitle) {
            // 年がタイトルに含まれている場合でも、最後にピリオドを追加
            journalDetails = journalDetails ? `${journalDetails}.` : `.`;
        }
        
        // DOIまたはURLリンクを追加
        let linkInfo = '';
        if (doi) {
            // DOIの正規化処理
            let cleanDoi = doi.trim();
            // 余分な中括弧や文字を削除
            cleanDoi = cleanDoi.replace(/^[{}]+|[{}]+$/g, '');
            
            const doiUrl = cleanDoi.startsWith('http') ? cleanDoi : `https://doi.org/${cleanDoi}`;
            linkInfo = ` <a href="${doiUrl}" target="_blank" rel="noopener noreferrer" class="doi-link">DOI</a>`;
        } else if (url) {
            linkInfo = ` <a href="${url}" target="_blank" rel="noopener noreferrer" class="url-link">URL</a>`;
        }
        
        return {
            number: index + 1,
            authors: authors,
            title: title,
            journalName: journalName,
            journalDetails: journalDetails,
            linkInfo: linkInfo,
            journal: journalName + journalDetails + linkInfo,
            year: year
        };
    }
}

// 動的番号管理機能
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOMContentLoaded event fired');
    const parser = new BibTeXParser();
    const publications = await parser.loadBibTeX();
    console.log('Loaded publications:', publications);
    
    if (publications.length > 0) {
        updatePublicationsFromBibTeX(publications);
    } else {
        console.log('No publications found, updating numbers only');
        updatePublicationNumbers();
    }
    
    // サイドメニューの機能を初期化
    initSideMenu();
});

function updatePublicationsFromBibTeX(publications) {
    // 各カテゴリのコンテナを取得
    const categoryContainers = {
        journal: document.querySelector('.journal-papers'),
        international_reviewed: document.querySelector('.international-reviewed'),
        international_other: document.querySelector('.international-other'),
        domestic: document.querySelector('.domestic'),
        grant: document.querySelector('.grant')
    };

    // 各コンテナが存在するかチェック
    Object.keys(categoryContainers).forEach(key => {
        if (!categoryContainers[key]) {
            console.error(`Container for category ${key} not found!`);
        }
    });
    
    // 既存の論文をクリア
    Object.values(categoryContainers).forEach(container => {
        if (container) container.innerHTML = '';
    });
    
    // カテゴリ別に分類
    const categories = {
        journal: { name: '論文誌', publications: [] },
        international_reviewed: { name: '国際会議（査読有）', publications: [] },
        international_other: { name: '国際会議（その他）', publications: [] },
        domestic: { name: '国内発表', publications: [] },
        grant: { name: '研究助成等', publications: [] }
    };
    
    // cleanValue関数を定義
    function cleanValue(value) {
        if (!value) return '';
        
        return value
            .replace(/^[\{\s]+|[\}\s]+$/g, '') // 先頭と末尾の中括弧と空白を削除
            .replace(/^["']|["']$/g, '') // 引用符を削除
            .replace(/\s+/g, ' ') // 複数の空白を1つに
            .replace(/\n/g, ' ') // 改行を空白に
            .trim();
    }
    
    // 論文をカテゴリ別に分類
    publications.forEach((pub, index) => {
        const category = cleanValue(pub.fields.category || 'international_reviewed');
        
        if (categories[category]) {
            categories[category].publications.push({ pub, index });
        } else {
            console.warn(`Unknown category: ${category}`);
        }
    });
    
    // 全体の連続番号を管理
    let globalNumber = 1;
    
    // 各カテゴリを表示
    Object.keys(categories).forEach(categoryKey => {
        const category = categories[categoryKey];
        const container = categoryContainers[categoryKey];
        
        if (container && category.publications.length > 0) {
            // カテゴリ内の論文
            category.publications.forEach(({ pub, index }) => {
                const parser = new BibTeXParser();
                const formatted = parser.formatPublication(pub, globalNumber - 1); // 全体の番号を使用
                
                const publicationItem = document.createElement('div');
                publicationItem.className = 'publication-item';
                publicationItem.setAttribute('data-year', formatted.year);
                
                publicationItem.innerHTML = `
                    <span class="pub-number">[${globalNumber}]</span>
                    <div class="pub-details">
                        <p class="pub-authors">${formatted.authors}</p>
                        <p class="pub-title">${formatted.title}</p>
                        <p class="pub-journal"><em>${formatted.journalName}</em>${formatted.journalName && formatted.journalDetails ? `, ${formatted.journalDetails}` : formatted.journalDetails}${formatted.linkInfo}</p>
                    </div>
                `;
                
                container.appendChild(publicationItem);
                globalNumber++; // 次の番号に進む
            });
        }
    });
}

function updatePublicationNumbers() {
    const publications = document.querySelectorAll('.publication-item');
    let currentNumber = 1;
    
    publications.forEach(function(publication) {
        const numberElement = publication.querySelector('.pub-number');
        numberElement.textContent = `[${currentNumber}]`;
        currentNumber++;
    });
}

// 新しい論文を追加する関数（BibTeX形式）
function addBibTeXEntry(bibEntry) {
    const parser = new BibTeXParser();
    parser.parseBibTeX(bibEntry);
    
    if (parser.publications.length > 0) {
        const newPub = parser.publications[0];
        const publicationsList = document.querySelector('.publications-list');
        
        const publicationItem = document.createElement('div');
        publicationItem.className = 'publication-item';
        publicationItem.setAttribute('data-year', newPub.fields.year || '');
        
        const formatted = parser.formatPublication(newPub, 0);
        publicationItem.innerHTML = `
            <span class="pub-number">[1]</span>
            <div class="pub-details">
                <p class="pub-authors">${formatted.authors}</p>
                <p class="pub-title">${formatted.title}</p>
                <p class="pub-journal">${formatted.journal}</p>
            </div>
        `;
        
        // 最新の論文を最初に挿入
        publicationsList.insertBefore(publicationItem, publicationsList.firstChild);
        
        // 番号を再計算
        updatePublicationNumbers();
    }
}

// 従来の関数（後方互換性のため）
function addPublication(authors, title, journal, year) {
    const publicationsList = document.querySelector('.publications-list');
    const newPublication = document.createElement('div');
    newPublication.className = 'publication-item';
    newPublication.setAttribute('data-year', year);
    
    newPublication.innerHTML = `
        <span class="pub-number">[0]</span>
        <div class="pub-details">
            <p class="pub-authors">${authors}</p>
            <p class="pub-title">${title}</p>
            <p class="pub-journal">${journal}</p>
        </div>
    `;
    
    // 最新の論文を最初に挿入
    publicationsList.insertBefore(newPublication, publicationsList.firstChild);
    
    // 番号を再計算
    updatePublicationNumbers();
}

// サイドメニューの機能
function initSideMenu() {
    const sideMenu = document.querySelector('.side-menu');
    
    // スムーズスクロール
    const sideMenuItems = document.querySelectorAll('.side-menu-item');
    sideMenuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // 各セクションに適切なオフセットを設定
                let offset = 60; // デフォルトのオフセット
                
                if (targetId === 'publications') {
                    offset = 100; // Publicationsはサブ見出しがあるので多めに
                } else if (targetId === 'biography') {
                    offset = 40; // Biographyは少なめに
                }
                
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // サブメニューのクリック機能
    const submenuItems = document.querySelectorAll('.submenu-item');
    submenuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            console.log('Submenu clicked, target ID:', targetId);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                console.log('Target element found:', targetElement);
                // サブメニュー項目のオフセット設定
                let offset = 80; // サブ見出し用のオフセット
                
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                
                console.log('Scrolling to position:', offsetPosition);
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            } else {
                console.error('Target element not found for ID:', targetId);
            }
        });
    });
    
    // スクロール時の動作
    window.addEventListener('scroll', function() {
        updateActiveSideMenu();
        updateSideMenuPosition();
    });
    
    // サイドメニューの位置更新
    function updateSideMenuPosition() {
        const scrollY = window.scrollY;
        const heroHeight = document.querySelector('.hero').offsetHeight;
        
        if (scrollY > heroHeight - 100) {
            // ヒーローセクションを過ぎたら上部に固定
            sideMenu.classList.add('scrolled');
        } else {
            // ヒーローセクション内では中央に配置
            sideMenu.classList.remove('scrolled');
        }
    }
}

function updateActiveSideMenu() {
    const sections = ['biography', 'information', 'research-topic', 'career', 'publications'];
    const sideMenuItems = document.querySelectorAll('.side-menu-item');
    
    let currentSection = '';
    
    sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
            const rect = element.getBoundingClientRect();
            // 各セクションに適切な判定範囲を設定
            if (sectionId === 'publications') {
                if (rect.top <= 120 && rect.bottom >= 50) {
                    currentSection = sectionId;
                }
            } else if (sectionId === 'biography') {
                if (rect.top <= 60 && rect.bottom >= 60) {
                    currentSection = sectionId;
                }
            } else {
                if (rect.top <= 80 && rect.bottom >= 80) {
                    currentSection = sectionId;
                }
            }
        }
    });
    
    // アクティブクラスを更新
    sideMenuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${currentSection}`) {
            item.classList.add('active');
        }
    });
}
