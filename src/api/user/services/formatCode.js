const { exec, execSync } = require('child_process');
const fs = require('fs');
const tmp = require('tmp');
const path = require('path');
const os = require('os');
const prettier = require('prettier');
const ApiResponse = require('@entities/ApiResponse');
const ApiError = require('@entities/ApiError');

/**
 * Express route handler to format code based on language.
 */
async function formatCodeByLanguage(req, res, next) {
    const { language, code } = req.body;

    console.log(`Formatting code for language: ${language}`);
    
    try {
        if (!language || !code) {
            return next(new ApiError(400, "Missing language or code parameter"));
        }

        let result;

        switch (language.toLowerCase()) {
            case 'cpp':
            case 'c++':
                result = await formatWithClang(code);
                break;
            case 'python':
            case 'py':
                result = await formatWithBlack(code);
                break;
            case 'javascript':
            case 'js':
                result = await formatWithPrettier(code, 'babel');
                break;
            case 'typescript':
            case 'ts':
                result = await formatWithPrettier(code, 'typescript');
                break;
            case 'css':
                result = await formatWithPrettier(code, 'css');
                break;
            case 'html':
                result = await formatWithPrettier(code, 'html');
                break;
            case 'java':
                result = await formatJava(code);
                break;
            default:
                // Try to use prettier with the specified language
                try {
                    result = await formatWithPrettier(code, language.toLowerCase());
                } catch (err) {
                    return next(new ApiError(400, `Unsupported language: ${language}`));
                }
        }

        return res.json(new ApiResponse(result.data, result.message));
    } catch (err) {
        console.error("Formatting error:", err);
        return next(new ApiError(500, `Error formatting ${language} code: ${err.message}`, err, "/api/format"));
    }
}

/**
 * Check if a tool is installed, works cross-platform
 */
function isToolInstalled(toolName) {
    try {
        const command = os.platform() === 'win32' ? 'where' : 'which';
        execSync(`${command} ${toolName}`, { stdio: 'ignore' });
        return true;
    } catch (err) {
        return false;
    }
}

/**
 * Safely read file content
 */
function safeReadFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
}

/**
 * Format code with clang-format (C/C++)
 */
function formatWithClang(code) {
    return new Promise((resolve, reject) => {
        if (!isToolInstalled('clang-format')) {
            // Fallback to prettier if clang-format is not available
            return formatWithPrettier(code, 'cpp')
                .then(resolve)
                .catch(() => {
                    reject(new Error("clang-format is not installed and prettier fallback failed. " +
                        "Please install clang-format via LLVM or use 'npm install -g clang-format'"));
                });
        }
        
        const tmpFile = tmp.fileSync({ postfix: '.cpp' });
        fs.writeFileSync(tmpFile.name, code);
        const filePath = tmpFile.name.replace(/\\/g, '/'); // Normalize path for all platforms

        exec(`clang-format "${filePath}"`, async (err, stdout, stderr) => {
            try {
                // If exec fails, try to read the file after formatting as fallback
                if (err) {
                    try {
                        // Some versions of clang-format modify in place instead of stdout
                        const formattedContent = await safeReadFile(filePath);
                        tmpFile.removeCallback();
                        resolve({
                            success: true,
                            data: formattedContent,
                            message: "C++ code formatted successfully"
                        });
                    } catch (readErr) {
                        tmpFile.removeCallback();
                        reject(new Error(`clang-format error: ${stderr || err.message}`));
                    }
                } else {
                    tmpFile.removeCallback();
                    resolve({
                        success: true,
                        data: stdout,
                        message: "C++ code formatted successfully"
                    });
                }
            } catch (cleanupErr) {
                console.error("Error cleaning up temp file:", cleanupErr);
                reject(err || cleanupErr);
            }
        });
    });
}

/**
 * Format code with black (Python)
 */

const isBlackAvailable = () => {
    return new Promise((resolve) => {
        exec('python -m black --version', (err) => {
            resolve(!err); // true if black is available
        });
    });
};

function formatWithBlack(code) {
    return new Promise((resolve, reject) => {
        if (!isBlackAvailable()) {
            // Fallback to prettier if black is not available
            console.warn("black formatter is not installed, falling back to prettier");
            return formatWithPrettier(code, 'python')
                .then(resolve)
                .catch(() => {
                    reject(new Error("black formatter is not installed and prettier fallback failed. " +
                        "Install it with 'pip install black'"));
                });
        }
        
        const tmpFile = tmp.fileSync({ postfix: '.py' });
        fs.writeFileSync(tmpFile.name, code);
        const filePath = tmpFile.name.replace(/\\/g, '/'); // Normalize path

        // Cross-platform command
        const catCommand = os.platform() === 'win32' ? 'type' : 'cat';
        exec(`python -m black -q "${filePath}" && ${catCommand} "${filePath}"`, async (err, stdout, stderr) => {
            try {
                // If command fails, try to read the file directly
                if (err) {
                    try {
                        const formattedContent = await safeReadFile(filePath);
                        tmpFile.removeCallback();
                        resolve({
                            success: true,
                            data: formattedContent,
                            message: "Python code formatted successfully"
                        });
                    } catch (readErr) {
                        tmpFile.removeCallback();
                        reject(new Error(`black formatter error: ${stderr || err.message}`));
                    }
                } else {
                    tmpFile.removeCallback();
                    resolve({
                        success: true,
                        data: stdout,
                        message: "Python code formatted successfully"
                    });
                }
            } catch (cleanupErr) {
                console.error("Error cleaning up temp file:", cleanupErr);
                reject(err || cleanupErr);
            }
        });
    });
}

/**
 * Format code with prettier
 */
function formatWithPrettier(code, parser) {
    return new Promise((resolve, reject) => {
        try {
            // Check if prettier supports this parser
            let options = {
                parser: parser,
                semi: true,
                singleQuote: true,
                printWidth: 80,
                tabWidth: 2
            };
            
            // Special cases for certain parsers
            if (parser === 'java') {
                // For Java, we need the plugin but we'll handle that in formatJava
                throw new Error("Java requires special handling");
            }
            
            const formatted = prettier.format(code, options);
            
            resolve({
                success: true,
                data: formatted,
                message: `Code formatted successfully with ${parser} parser`
            });
        } catch (err) {
            reject(new Error(`Prettier formatting failed with ${parser} parser: ${err.message}`));
        }
    });
}

/**
 * Handle Java formatting with multiple options
 */
async function formatJava(code) {
    // First, try with prettier-plugin-java if available
    try {
        // Try to dynamically require the plugin
        let prettierJava;
        try {
            prettierJava = require('prettier-plugin-java');
        } catch (requireErr) {
            // Plugin not available, will try other methods
        }
        
        if (prettierJava) {
            const formatted = prettier.format(code, {
                parser: 'java',
                plugins: [prettierJava],
                tabWidth: 4
            });
            
            return {
                success: true,
                data: formatted,
                message: "Java code formatted successfully with prettier-plugin-java"
            };
        }
    } catch (prettierErr) {
        // Prettier with Java plugin failed, continue to next method
    }
    
    // Next, try with google-java-format if installed
    if (isToolInstalled('google-java-format')) {
        return new Promise((resolve, reject) => {
            const tmpFile = tmp.fileSync({ postfix: '.java' });
            fs.writeFileSync(tmpFile.name, code);
            const filePath = tmpFile.name.replace(/\\/g, '/'); // Normalize path

            exec(`google-java-format "${filePath}"`, async (err, stdout, stderr) => {
                try {
                    if (err) {
                        try {
                            // Try reading the file directly in case it was modified in place
                            const formattedContent = await safeReadFile(filePath);
                            tmpFile.removeCallback();
                            resolve({
                                success: true,
                                data: formattedContent,
                                message: "Java code formatted successfully with google-java-format"
                            });
                        } catch (readErr) {
                            tmpFile.removeCallback();
                            reject(new Error(`Java formatting error: ${stderr || err.message}`));
                        }
                    } else {
                        tmpFile.removeCallback();
                        resolve({
                            success: true,
                            data: stdout,
                            message: "Java code formatted successfully with google-java-format"
                        });
                    }
                } catch (cleanupErr) {
                    console.error("Error cleaning up temp file:", cleanupErr);
                    reject(err || cleanupErr);
                }
            });
        });
    }
    
    // Last resort - return unformatted code with a warning
    return {
        success: false,
        data: code, // Return original code
        message: "Warning: Java formatting tools not available. Code returned unformatted. " +
                 "Install prettier-plugin-java or google-java-format for Java formatting."
    };
}

module.exports = formatCodeByLanguage;