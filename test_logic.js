const purity = '99.99';
const mainMetal = 'Silver';
let mappedMetal = '';
if (mainMetal === 'Gold') {
    if (purity === '99.99') mappedMetal = 'pure_gold_9999';
    else if (purity === '99.9') mappedMetal = 'pure_gold_999';
    else if (purity === '99.5') mappedMetal = 'pure_gold_995';
    else mappedMetal = 'gold_22k';
} else if (mainMetal === 'Silver') {
    if (purity === '99.99') mappedMetal = 'pure_silver_9999';
    else if (purity === '99.9') mappedMetal = 'pure_silver_999';
    else if (purity === '99.5') mappedMetal = 'pure_silver_995';
    else mappedMetal = 'silver_925';
}
console.log("mappedMetal: ", mappedMetal);
