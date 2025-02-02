
let currentStep = 0;
let questions = [];
let products = [];
let userAnswers = {
    category: null,
    color: null,
    price: null
};


const elements = {
    question: document.querySelector('.question'),
    product: document.querySelector('.product'),
    next: document.querySelector('.next-btn'),
    back: document.querySelector('.back-btn'),
    navigation: document.querySelector('.navigation')
};


const COLOR_CODES = {
    'siyah': '#000000',
    'beyaz': '#FFFFFF',
    'kırmızı': '#FF0000',
    'mavi': '#0000FF',
    'yeşil': '#008000',
    'sarı': '#FFFF00',
    'turuncu': '#FFA500',
    'mor': '#800080',
    'pembe': '#FFC0CB',
    'gri': '#808080',
    'kahverengi': '#8B4513',
    'bej': '#F5F5DC',
    'çok renkli': 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)'
};

// Veri yükleme
async function loadData() {
    try {
        const [questionResponse, productResponse] = await Promise.all([
            fetch('data/questions.json'),
            fetch('data/products.json')
        ]);

        questions = (await questionResponse.json())[0].steps;
        products = await productResponse.json();
        return true;
    } catch (error) {
        console.error('Veri yükleme hatası:', error);
        return false;
    }
}

// Soru tipini alma
function getCurrentQuestionType() {
    return questions[currentStep]?.type === 'question' ? 'category' : questions[currentStep]?.type;
}


function createOption(answers, type) {
    if (type === 'color') {
        return `<div class="color-options">
            ${Object.keys(COLOR_CODES).map(color => `
                <button class="color-btn ${userAnswers.color === color ? 'selected' : ''}" 
                        data-value="${color}" 
                        style="background: ${COLOR_CODES[color]}">
                </button>
            `).join('')}
        </div>`;
    }

    return answers.map(answer => `
        <button class="option-btn ${userAnswers[type === 'question' ? 'category' : type] === answer ? 'selected' : ''}" 
                data-value="${answer}">
            ${answer}
        </button>
    `).join('');
}


function showQuestion() {
    const currentQuestion = questions[currentStep];
    if (!currentQuestion?.title || !currentQuestion?.answers) return;

    elements.question.innerHTML = `
        <h2>${currentQuestion.title}</h2>
        ${currentQuestion.subtitle ? `<p class="subtitle">${currentQuestion.subtitle}</p>` : ''}
        <div class="options">
            ${createOption(currentQuestion.answers, currentQuestion.type)}
        </div>
        <div class="step-indicators">
            ${Array(questions.length).fill().map((_, index) => `
                <span class="indicator ${index === currentStep ? 'active' : ''}"></span>
            `).join('')}
        </div>
    `;

    addOptionListeners();
}


function addOptionListeners() {
    const options = document.querySelectorAll('.option-btn, .color-btn');
    
    options.forEach(option => {
        option.addEventListener('click', handleOptionSelect);
    });
}

function handleOptionSelect(e) {
    const options = document.querySelectorAll('.option-btn, .color-btn');
    options.forEach(opt => opt.classList.remove('selected'));
    
    e.currentTarget.classList.add('selected');
    
    const questionType = getCurrentQuestionType();
    if (questionType) {
        userAnswers[questionType] = e.currentTarget.dataset.value;
        elements.next.disabled = false;
    }
}


function handleNext() {
    const currentType = getCurrentQuestionType();
    if (!userAnswers[currentType]) return;
    
    currentStep++;
    
    if (currentStep < questions.length) {
        showQuestion();
        elements.next.disabled = true;
    } else {
        showResults();
    }
    
    elements.back.disabled = false;
}

function handleBack() {
    if (currentStep > 0) {
        currentStep--;
        showQuestion();
        
        elements.back.disabled = currentStep === 0;
        elements.next.disabled = !userAnswers[getCurrentQuestionType()];
    }
}

function checkPriceMatch(productPrice, priceRange) {
    if (priceRange.includes('+')) {
        return productPrice >= parseFloat(priceRange);
    }
    const [min, max] = priceRange.split('-').map(Number);
    return productPrice >= min && productPrice <= max;
}

function filterProducts() {

    const lowerCategory = userAnswers.category.toLowerCase();
    const lowerColor = userAnswers.color.toLowerCase();

    return products.filter(product => {
    
        const categoryMatch = product.category.some(cat => 
            cat.toLowerCase().includes(lowerCategory)
        );
       
        const colorMatch = product.colors.some(color => 
            color.toLowerCase() === lowerColor
        );
        
        const productPrice = parseFloat(product.price);
        const priceMatch = checkPriceMatch(productPrice, userAnswers.price);
        
        return categoryMatch && colorMatch && priceMatch;
    });
}

function showResults() {
    elements.question.style.display = 'none';
    elements.navigation.style.display = 'none';
    elements.product.style.display = 'block';
    
    const filteredProducts = filterProducts();
    showFilteredProducts(filteredProducts);
}

function showFilteredProducts(filteredProducts) {
    if (filteredProducts.length === 0) {
        elements.product.innerHTML = `
        <div class="loading">
            <div class="loading-text">Loading...</div>
        </div>
    `;
    
    setTimeout(() => {
        elements.product.innerHTML = '<p class="no-product">No Product Found</p>';
    }, 1000);
    return;
    }

    elements.product.innerHTML = createProductSliderHTML(filteredProducts);
    
    initializeSlider();
}

function createProductSliderHTML(products) {
    return `
        <div class="slider-container">
            <div class="product-slider">
                ${products.map(product => `
                    <div class="product-card">
                        <img src="${product.image}" alt="${product.name}" loading="lazy">
                        <h3>${product.name}</h3>
                        <div class="price-container">
                            ${product.oldPrice ? 
                                `<div class="old-price">${product.oldPriceText}</div>
                                 <div class="current-price">${product.priceText}</div>` 
                                : `<div class="normal-price">${product.priceText}</div>`
                            }
                        </div>
                        <button class="view-btn">VIEW PRODUCT</button>
                    </div>
                `).join('')}
            </div>
            ${products.length > 1 ? createSliderNavigation() : ''}
        </div>
        <div class="step-indicators">
            ${products.map((_, index) => `
                <div class="indicator${index === 0 ? ' active' : ''}" data-slide="${index}"></div>
            `).join('')}
        </div>
    `;
}

function createSliderNavigation() {
    return `
        <button class="slider-btn prev-btn">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
                <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z"/>
            </svg>
        </button>
        <button class="slider-btn next-btn">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
                <path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/>
            </svg>
        </button>
    `;
}

function initializeSlider() {
    const slider = document.querySelector('.product-slider');
    const slides = document.querySelectorAll('.product-card');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const indicators = document.querySelectorAll('.indicator');
    let currentSlide = 0;

    function updateSlider() {
        slides.forEach((slide, index) => {
            slide.style.transform = `translateX(${(index - currentSlide) * 100}%)`;
        });
        
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentSlide);
        });
    }

    function handleSlide(direction) {
        if (direction === 'prev' && currentSlide > 0) {
            currentSlide--;
        } else if (direction === 'next' && currentSlide < slides.length - 1) {
            currentSlide++;
        }
        updateSlider();
    }

    slides.forEach((slide, index) => {
        slide.style.transform = `translateX(${index * 100}%)`;
    });

    if (prevBtn) prevBtn.addEventListener('click', () => handleSlide('prev'));
    if (nextBtn) nextBtn.addEventListener('click', () => handleSlide('next'));

    updateSlider();
}

async function init() {
    try {
        const dataLoaded = await loadData();
        if (!dataLoaded) return;

        showQuestion();
        
        elements.next.addEventListener('click',handleNext);
        elements.back.addEventListener('click',handleBack);
        
        elements.back.disabled = true;
        elements.next.disabled = true;
    } catch (error) {
        console.error('Başlatma hatası:', error);
    }
}

document.addEventListener('DOMContentLoaded', init);