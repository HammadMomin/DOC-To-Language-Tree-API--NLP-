const express = require('express');
const path = require("path");
const multer = require('multer');
const fs = require('fs');
const natural = require('natural');
const app = express();

const defaultLexicon = new natural.Lexicon();
const defaultRules = new natural.RuleSet();


const lexicon = new natural.Lexicon(defaultLexicon);
const rules = new natural.RuleSet(defaultRules);
const tagger = new natural.BrillPOSTagger(lexicon, rules, null);


// const {BrillPOSTagger} = require('natural');
// const defaultRules = BrillPOSTagger.defaultRules;

// const tagger = new natural.BrillPOSTagger();


const static_path = path.join(__dirname, "./public");

app.use(express.json());
app.use(express.urlencoded({extended:false}));
// app.use(cookieParser());
app.use(express.static(static_path));



app.get("/" , (req, res) => {
    res.sendFile(path.join(static_path, "index.html"));
   //res.render("welcome")
})




const upload = multer({ dest: 'uploads/' });

///Preprossing 

function preprocess(text) {
// Convert to lowercase
text = text.toLowerCase();

// Remove punctuation
text = text.replace(/[^\w\s]/g, "");

// Remove numbers
text = text.replace(/\d+/g, "");

// Remove stop words (common words that don't add much meaning)
const stopWords = [
  "a",
  "an",
  "the",
  "and",
  "but",
  "or",
//   "for",
  "nor",
  "on",
  "at",
  "to",
  "from",
  "by",
  "in",
  "out",
  "of"
];
text = text
  .split(" ")
  .filter(word => !stopWords.includes(word))
  .join(" ");

// Perform stemming (reducing words to their base form)
const stemmer = natural.PorterStemmer;
text = text
  .split(" ")
  .map(word => stemmer.stem(word))
  .join(" ");

return text;
}

// function constructTree(data) {
//     // Construct the language tree from the parsed data here
//     const tokenizer = new natural.WordTokenizer();
//     // const posTagger = new natural.BrillPOSTagger();
//     const posTagger = new natural.BrillPOSTagger(lexicon, rules, null);
//     const words = tokenizer.tokenize(preprocess(data));

//     console.log(words);
    
//     const taggedWords = posTagger.tag(words);
//     const tree = [];
//     for (const [word, pos] of taggedWords) {
//       tree.push({ word, pos });
//     }
//     return tree;
//   }

function constructTree(data) {
    // Construct the language tree from the parsed data here
    const tokenizer = new natural.WordTokenizer();
    const posTagger = new natural.BrillPOSTagger(
      lexicon,
      rules
    );
    const words = tokenizer.tokenize(preprocess(data));
    const taggedWords = posTagger.tag(words);
    const taggedWordsArray = Object.values(taggedWords);

    // console.log(taggedWords);
    // console.log(taggedWordsArray);
    
    if (!Array.isArray(taggedWordsArray)) {
      console.error('Error: taggedWords is not an array');
      return null;
    }
  
    const tree = [];
    for (const [word, pos] of taggedWordsArray) {
      tree.push({ word, pos });
    }
    return tree;
  }
  
  



// app.post('/upload', upload.single('file'), async (req, res) => {
//   try {
//     const data = await fs.promises.readFile(req.file.path, 'utf8');
//     console.log(data);
//     const tree = constructTree(data);
//     console.log(tree);
//     res.json(tree);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error processing file');
//   }
// });

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
      const data = await fs.promises.readFile(req.file.path, 'utf8');
      const tree = constructTree(data);

      console.log(tree);
    //   res.json(tree);


      res.json({ tree: tree });

    } catch (error) {
      console.error(error);
      res.status(500).send('Error processing file');
    } finally {
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error(err);

        }
      });
    }
  });


app.listen(3000, () => {
  console.log('Server started on port 3000');
});
