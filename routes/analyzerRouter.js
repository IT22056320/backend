const router = require('express').Router();
const Analyzer = require("../models/Analyzer.js");
const esprima = require('esprima');

const parseCode = (code) => {
    try {
        return esprima.parseScript(code, { tolerant: true, loc: true, range: true });
    } catch (e) {
        throw new Error("Code Parsing Error: " + e.message);
    }
};

const calculateCyclomaticComplexity = (ast) => {
    let cyclomaticComplexity = 1; // Base complexity

    const visit = (node) => {
        // Check for decision nodes
        if (node.type === 'IfStatement' ||
            node.type === 'ForStatement' ||
            node.type === 'WhileStatement' ||
            node.type === 'DoWhileStatement' ||
            node.type === 'SwitchStatement' ||
            node.type === 'CatchClause' ||
            node.type === 'ConditionalExpression' ||
            node.type === 'ForInStatement' ||
            node.type === 'ForOfStatement') {
            cyclomaticComplexity++;
        }
        // Recursively visit child nodes
        for (let key in node) {
            if (node[key] && typeof node[key] === 'object') {
                visit(node[key]);
            }
        }
    };
    visit(ast);
    return cyclomaticComplexity;
};

const calculateMaintainabilityIndex = (cyclomaticComplexity, sloc) => {
    if (sloc <= 0) {
        return 0; // Return 0 if SLOC is invalid
    }

    const index = 171 - (5.2 * Math.log10(cyclomaticComplexity || 1)) - (0.23 * sloc) - (16.2 * Math.log10(sloc)) + (50 * Math.sin(Math.sqrt(2.4 * sloc)));
    return Math.max(0, Math.min(100, index)); // Clamp between 0 and 100
};

const analyzeCode = (code) => {
    const lines = code.split('\n');
    let loc = lines.length; // Total lines of code
    let lloc = 0; // Logical lines of code
    let sloc = 0; // Source lines of code
    let comments = 0; // Count of comments
    let inBlockComment = false; // Track if we're inside a block comment

    lines.forEach(line => {
        const trimmedLine = line.trim();

        // Ignore empty lines
        if (trimmedLine.length === 0) return;

        // Handle block comments (/* ... */)
        if (inBlockComment) {
            comments++; // Count each line within the block comment
            if (trimmedLine.includes('*/')) {
                inBlockComment = false; // Close block comment
            }// Count all lines inside block comment
            return; // Don't process further
        }

        if (trimmedLine.startsWith('/*')) {
            comments++; // Count the starting block comment
            if (!trimmedLine.includes('*/')) {
                inBlockComment = true; // Start block comment, but it hasn't ended
            }
            return;
        }

        // Handle single-line comments (//)
        if (trimmedLine.startsWith('//')) {
            comments++; // Single-line comment
            return;
        }

        // Check for inline comments (e.g., code before or after //)
        if (trimmedLine.includes('//')) {
            const [codePart, commentPart] = trimmedLine.split('//');
            if (commentPart.trim().length > 0) {
                comments++; // Count the inline comment
            }

            // If there's no code before the comment (purely a comment line), skip the rest
            if (codePart.trim().length === 0) {
                return;
            }
        }

        // Count logical and source lines of code (ignoring comments)
        if (trimmedLine.includes(';') || trimmedLine.includes('{') || trimmedLine.includes('}')) {
            lloc++; // Logical line of code
        }
        sloc++; // Source line of code
    });

    const ast = parseCode(code);
    const cyclomaticComplexity = calculateCyclomaticComplexity(ast);
    const maintainabilityIndex = calculateMaintainabilityIndex(cyclomaticComplexity, sloc);

    const commentPercentage = ((comments / loc) * 100).toFixed(2);
    const codeToCommentRatio = comments ? (sloc / comments).toFixed(2) : 'N/A';

    return {
        loc,
        lloc,
        sloc,
        comments,
        commentPercentage,
        codeToCommentRatio,
        cyclomaticComplexity,
        maintainabilityIndex: isNaN(maintainabilityIndex) ? 0 : maintainabilityIndex.toFixed(2) // Ensure it's a number
    };
};

router.post("/home", async (req, res) => {
    const { fileName, code } = req.body;

    if (!fileName || !code) {
        return res.status(400).json({ error: "File name and code are required" });
    }

    // Manual Validation
    if (fileName.length > 20) {
        return res.status(400).json({ error: "File name must be provided and cannot exceed 20 characters." });
    }

    if (!/\.js$/.test(fileName)) {
        return res.status(400).json({ error: "File name must end with .js" });
    }

    // Syntax validation using esprima
    try {
        esprima.parseScript(code); // This will throw an error if the code is invalid
    } catch (syntaxError) {
        return res.status(400).json({ error: "Invalid JavaScript code", details: syntaxError.message });
    }

    try {
        // Analyze the code to calculate metrics
        const analysis = analyzeCode(code);

        // Create a new Analyzer document
        const newAnalysis = new Analyzer({
            fileName,
            code,
            ...analysis,
            status: 'analyzed'  // Default status
        });

        // Save the document to the database
        const savedAnalysis = await newAnalysis.save();

        // Respond with the saved analysis data
        return res.status(201).json(savedAnalysis);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
});

router.delete("/home/:id", async (req, res) => {
    const { id } = req.params;
    
    try {
        await Analyzer.findByIdAndDelete(id);
        res.status(200).json({success: true, message: "code Deleted"});
    } catch (error) {
        console.log("error in deleting code:", error.message);
        res.status(404).json({success: false, message: "code not found"});
    }
});

router.get("/home", async (req, res) => {
    try {
        const analyzeAll = await Analyzer.find({});
        res.status(200).json({success: true, data: analyzeAll});
    } catch (error) {
        console.log("error in fetching code:", error.message);
        res.status(500).json({success: false, message: "Server Error"});
    }
});

router.get("/home/:id", async (req, res) => {
    const { id } = req.params;
    
    try {
        const analyzeAll = await Analyzer.findById(id, 'fileName code').exec();
        if (!analyzeAll) {
            return res.status(404).json({ success: false, message: "Data not found" });
        }
        res.status(200).json({ success: true, data: analyzeAll });
    } catch (error) {
        console.log("Error in fetching data:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

router.patch("/home/:id", async (req, res) => {
    const { id } = req.params;
    const { fileName, code } = req.body;

    if (code) {
        // Syntax validation using esprima
        try {
            esprima.parseScript(code); // This will throw an error if the code is invalid
        } catch (syntaxError) {
            return res.status(400).json({ error: "Invalid JavaScript code", details: syntaxError.message });
        }
    }

    try {
        // Find the document by ID and update fileName and code only
        const updatedData = {};

        if (fileName) {
            updatedData.fileName = fileName;
        }

        if (code) {
            updatedData.code = code;

            // Optionally, you can re-run the analysis if code is updated
            const analysis = analyzeCode(code);
            updatedData.loc = analysis.loc;
            updatedData.lloc = analysis.lloc;
            updatedData.sloc = analysis.sloc;
            updatedData.comments = analysis.comments;
            updatedData.commentPercentage = analysis.commentPercentage;
            updatedData.codeToCommentRatio = analysis.codeToCommentRatio;
            updatedData.cyclomaticComplexity = analysis.cyclomaticComplexity;
            updatedData.maintainabilityIndex = analysis.maintainabilityIndex;
        }

        const updatedAnalysis = await Analyzer.findByIdAndUpdate(id, updatedData, { new: true });

        if (!updatedAnalysis) {
            return res.status(404).json({ error: "Document not found" });
        }

        return res.status(200).json(updatedAnalysis);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;