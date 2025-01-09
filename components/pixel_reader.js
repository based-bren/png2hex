// Create a function to read the PNG file and process its pixels
function processImage(imageFile) {
    return new Promise((resolve, reject) => {
        // Create an image element
        const img = new Image();
        img.onload = () => {
            // Verify image dimensions
            if (img.width !== 32 || img.height !== 32) {
                reject('Image must be 32x32 pixels');
                return;
            }

            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 32;
            canvas.height = 32;

            // Draw image on canvas
            ctx.drawImage(img, 0, 0);

            // Get pixel data
            const imageData = ctx.getImageData(0, 0, 32, 32);
            const pixels = imageData.data;

            // Process each pixel
            let output = [];
            for (let y = 0; y < 32; y++) {
                for (let x = 0; x < 32; x++) {
                    const index = (y * 32 + x) * 4;
                    const red = pixels[index];
                    const green = pixels[index + 1];
                    const blue = pixels[index + 2];
                    const alpha = pixels[index + 3];
                    // Only output pixels that are not transparent (alpha > 0)
                    if (alpha > 0) {
                        output.push(`${x},${y},${red},${green},${blue}`);
                    }
                }
            }

            resolve(output);
        };

        img.onerror = () => {
            reject('Error loading image');
        };

        // Read the file
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
        };
        reader.readAsDataURL(imageFile);
    });
}

// Create HTML elements for file input and output display
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.png';
fileInput.multiple = true; // Allow multiple file selection
document.body.appendChild(fileInput);

// Add checkbox for hex output
const hexCheckbox = document.createElement('input');
hexCheckbox.type = 'checkbox';
hexCheckbox.id = 'hexOutput';
const hexLabel = document.createElement('label');
hexLabel.htmlFor = 'hexOutput';
hexLabel.textContent = ' Output as Hexadecimal';
document.body.appendChild(hexCheckbox);
document.body.appendChild(hexLabel);

// Add checkbox for Solidity export
const solidityCheckbox = document.createElement('input');
solidityCheckbox.type = 'checkbox';
solidityCheckbox.id = 'solidityOutput';
const solidityLabel = document.createElement('label');
solidityLabel.htmlFor = 'solidityOutput';
solidityLabel.textContent = ' Solidity Export';
document.body.appendChild(document.createElement('br'));
document.body.appendChild(solidityCheckbox);
document.body.appendChild(solidityLabel);

const output = document.createElement('pre');
document.body.appendChild(output);

// Function to convert RGB to hex
function rgbToHex(r, g, b) {
    return [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// Add event listener for file selection
fileInput.addEventListener('change', async (e) => {
    try {
        const files = Array.from(e.target.files);
        const results = [];
        const hexValues = [];
        const fileNames = [];
        
        // Process each file
        for (const file of files) {
            const pixelData = await processImage(file);
            
            let result;
            if (hexCheckbox.checked) {
                // Convert to hex format
                const hexString = pixelData.map(pixel => {
                    const [x, y, r, g, b] = pixel.split(',').map(Number);
                    // Ensure each component has 2 hex digits
                    const xHex = x.toString(16).padStart(2, '0');
                    const yHex = y.toString(16).padStart(2, '0');
                    const rgbHex = rgbToHex(r, g, b);
                    // Each pixel will now be 8 hex digits (2+2+6 = 10 nibbles)
                    return `${xHex}${yHex}${rgbHex}`;
                }).join('');
                
                // Calculate padding needed
                const length = hexString.length;
                const mod5 = length % 10; // Each XYRGB group is 10 nibbles
                const paddingLength = mod5 === 0 ? 0 : (10 - mod5);
                
                // Add padding zeros if needed
                result = hexString + '0'.repeat(paddingLength);
                
                // Store values for Solidity format
                hexValues.push(result);
                fileNames.push(file.name.replace('.png', ''));
            } else {
                // Original decimal format
                result = pixelData.join(',');
            }
            
            if (!solidityCheckbox.checked) {
                results.push(`${file.name} = ${result}`);
            }
        }
        
        // Display results based on format
        if (solidityCheckbox.checked && hexCheckbox.checked) {
            const hexArray = hexValues.map(hex => `bytes(hex"${hex}")`).join(',\n');
            const namesArray = fileNames.map(name => `"${name}"`).join(',\n');
            output.textContent = `// Hex values array:\n[\n${hexArray}\n]\n\n// Names array:\n[\n${namesArray}\n]`;
        } else {
            output.textContent = results.join('\n');
        }
    } catch (error) {
        output.textContent = `Error: ${error}`;
    }
});

// Add event listener for both checkboxes to update output format when changed
hexCheckbox.addEventListener('change', async () => {
    if (fileInput.files.length > 0) {
        const event = new Event('change');
        fileInput.dispatchEvent(event);
    }
});

solidityCheckbox.addEventListener('change', async () => {
    if (fileInput.files.length > 0) {
        const event = new Event('change');
        fileInput.dispatchEvent(event);
    }
}); 