const express = require('express');
const router = express.Router();
const Analyzer = require("../models/Analyzer.js");
const esprima = require('esprima');

// Helper functions for code analysis
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
        return 0;
    }
    const index = 171 - (5.2 * Math.log10(cyclomaticComplexity || 1)) - (0.23 * sloc) - (16.2 * Math.log10(sloc)) + (50 * Math.sin(Math.sqrt(2.4 * sloc)));
    return Math.max(0, Math.min(100, index));
};

const analyzeCode = (code) => {
    const lines = code.split('\n');
    let loc = lines.length;
    let lloc = 0;
    let sloc = 0;
    let comments = 0;
    let inBlockComment = false;

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.length === 0) return;

        if (inBlockComment) {
            comments++;
            if (trimmedLine.includes('*/')) {
                inBlockComment = false;
            }
            return;
        }

        if (trimmedLine.startsWith('/*')) {
            comments++;
            if (!trimmedLine.includes('*/')) {
                inBlockComment = true;
            }
            return;
        }

        if (trimmedLine.startsWith('//')) {
            comments++;
            return;
        }

        if (trimmedLine.includes('//')) {
            const [codePart, commentPart] = trimmedLine.split('//');
            if (commentPart.trim().length > 0) {
                comments++;
            }
            if (codePart.trim().length === 0) {
                return;
            }
        }

        if (trimmedLine.includes(';') || trimmedLine.includes('{') || trimmedLine.includes('}')) {
            lloc++;
        }
        sloc++;
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
        maintainabilityIndex: isNaN(maintainabilityIndex) ? 0 : maintainabilityIndex.toFixed(2)
    };
};

// Routes for 'project'
router.post("/project", async (req, res) => {
    const { fileName, code } = req.body;

    if (!fileName || !code) {
        return res.status(400).json({ error: "File name and code are required" });
    }

    if (fileName.length > 20) {
        return res.status(400).json({ error: "File name must be provided and cannot exceed 20 characters." });
    }

    if (!/\.js$/.test(fileName)) {
        return res.status(400).json({ error: "File name must end with .js" });
    }

    try {
        esprima.parseScript(code);
    } catch (syntaxError) {
        return res.status(400).json({ error: "Invalid JavaScript code", details: syntaxError.message });
    }

    try {
        const analysis = analyzeCode(code);

        const newAnalysis = new Analyzer({
            fileName,
            code,
            ...analysis,
            status: 'analyzed'
        });

        const savedAnalysis = await newAnalysis.save();

        return res.status(201).json(savedAnalysis);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
});

router.delete("/project/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await Analyzer.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Code Deleted" });
    } catch (error) {
        console.log("Error in deleting code:", error.message);
        res.status(404).json({ success: false, message: "Code not found" });
    }
});

router.get("/project", async (req, res) => {
    try {
        const analyzeAll = await Analyzer.find({});
        res.status(200).json({ success: true, data: analyzeAll });
    } catch (error) {
        console.log("Error in fetching code:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

router.get("/project/:id", async (req, res) => {
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

router.patch("/project/:id", async (req, res) => {
    const { id } = req.params;
    const { fileName, code } = req.body;

    if (fileName && fileName.length > 15) {
        return res.status(400).json({ error: "File name cannot exceed 15 characters." });
    }

    if (fileName && !/\.js$/.test(fileName)) {
        return res.status(400).json({ error: "File name must end with .js" });
    }

    if (code) {
        try {
            esprima.parseScript(code);
        } catch (syntaxError) {
            return res.status(400).json({ error: "Invalid JavaScript code", details: syntaxError.message });
        }
    }

    try {
        const updatedData = {};

        if (fileName) {
            updatedData.fileName = fileName;
        }

        if (code) {
            updatedData.code = code;

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
