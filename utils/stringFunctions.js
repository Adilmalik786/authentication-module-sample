const { text } = require("body-parser");

exports.removeHtmlTags = str => {
  if ((str === null) || (str === ''))
    return false;
  else
    str = str.toString();
  return str.replace(/(<([^>]+)>)/ig, '');
}

exports.extractKeywords = string => {
  // common word to exclude
  const commonWords = ['i', 'a', 'about', 'an', 'and', 'are', 'as',
    'at', 'be', 'by', 'com', 'de', 'en', 'for',
    'from', 'how', 'in', 'is', 'it', 'la', 'of', 'on', 'or', 'that',
    'the', 'this', 'to', 'was', 'what', 'when', 'where', 'who', 'will',
    'with', 'und', 'the', 'www', 'different', 'which', 'during', 'discuss', 'company', 'presented',
    'including', 'statement', 'statements', 'companies', 'present', 'prepare', 'prepares',
    'selected', 'select', 'selects', 'other', 'others', 'information', 'continuing', 'included',
    'include', 'Includes', 'meant', 'within', 'follows', 'follow', 'should', 'data', 'related',
    'relate', 'relates', 'below', 'above', 'following', 'instruction', 'instructions',
    'appropriate', 'explain', 'between', 'whichever', 'under', 'therefore', 'would', 'assume',
    'transaction', 'answer', 'question', 'answers', 'questions', 'transaction', 'explain',
    'explains', 'explained', 'about', 'where', 'using', 'briefly', 'describe'];


  // Convert to lowercase
  let text = string.toLowerCase();

  // remove html tags from the question to generate keywords
  text = this.removeHtmlTags(text);

  // replace unnesessary chars. leave only chars, numbers and space
  text = text.replace(/[^\w\d ]/g, '');

  var result = text.split(' ');

  // remove $commonWords
  result = result.filter(function (word) {
    return commonWords.indexOf(word) === -1;
  });

  // Unique words
  // result = result.unique();

  // remove empty strings and duplicates from the array
  var filteredArray = result.filter(function (el, pos) {
    return (el != "") && (result.indexOf(el) == pos);
  });

  keywords = filteredArray.toString();
  console.log({ text, result, filteredArray, keywords });

  return keywords;
}


exports.generateMetaDescription = string => {
  // remove the html tags to be appearing in the description
  string = this.removeHtmlTags(string);

  // this answer to will be added to view page meta

  // modifiedString = "Answer to " + string;
  const newDesc = string.replace(/['"]+/g, '');
  // trim the meta description to 145 words
  return newDesc.substr(0, 145);
}



exports.getWordCount = string => {
  return string.split(' ').length;
}
