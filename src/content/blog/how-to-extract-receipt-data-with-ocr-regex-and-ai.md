---
title: "How to Extract Receipt Data with OCR, Regex and AI"
description: "Our journey of developing the high accuracy receipt extraction solution."
excerpt: "Our journey of developing the high accuracy receipt extraction solution."
category: machine-learning
author: FormX
date: 2025-02-10
lastmod: 2024-03-28
featured_image: "/images/blog/614d788a8bd0470c5cf7db82_Receipt-Extraction-Main.png"
featured_image_alt: "How to Extract Receipt Data with OCR, Regex and AI"
canonical_url: "/blog/how-to-extract-receipt-data-with-ocr-regex-and-ai"
---

Optical Image Recognition (OCR) has been widely used these days to extract information from various documents like receipts to digitize physical paper documents and optimize document management workflow. Even though receipt OCR comes in handy when businesses have to deal with piles of receipts every day, an OCR receipt scanner itself is not enough to generate accurate-enough results.

In this blog post, we will be discussing:

Usually, you will store all the receipts in one place and start processing them after a few days. To digitize them manually, you will have to locate the relevant information, enter it in a spreadsheet, verify that what you’ve typed is correct, and proceed to the next one until you finally digitize piles of receipts. You might even need to take an extra step to upload the spreadsheet to different systems for operational or accounting purposes. Sounds dreadful, doesn’t it?   


With receipt OCR, you can shorten the process from hours or even days to just a few minutes. After setting up the template and the specific data fields you want, the software will extract information from batches of images or PDF files, organize them to generate structured data, and even send the end results to other systems as requested. All you have to do is upload the files and verify that the final results are accurate, minimizing your efforts and significantly increasing operational efficiency.   


Performing repetitive tasks, such as manual data entry, can be quite dull and that might affect the quality of your data once the staff starts drifting off and all the numbers and words become blurry. Receipt OCR never has a hard time staying focused and it can recognize the texts, extract them, and organize the outputs with high accuracy.

Manual data entry can be quite labor-intensive and the more receipts you have to process, the higher your human resource costs will get. Furthermore, there might be some additional costs associated with data inaccuracy caused by human errors. With additional post-processing involving artificial intelligence, OCR receipt scanner can help you reduce these costs and free up office space as you will not have to hire more staff to digitize receipts manually or stash piles of receipts at your office.

Even though both digital files and physical paper documents can be lost to or damaged by physical, environmental, or technological hazards, those businesses having digital backups still have a higher chance of recovering their data since they can keep copies in both local hardwares or cloud storage.

Furthermore, data security and access management will certainly be easier once the receipts are digitized with receipt OCR since the data will most likely be encrypted or stored in the cloud that cannot be accessed by anyone.

When extracting data with receipt OCR, there are a few challenges that we have to address. Layouts of receipts vary hugely as every company has its own format. It is therefore hard to come up with a universal rule to extract data from all receipt templates. Furthermore, once you scan the receipts into images or PDF files, they can be artifacted, making them ever harder to read. Not to mention that there are numerous factors that can compromise the quality of the image such as orientation, wrinkles, font sizes, lightness, handwritten texts, and more.   


To help OCR receipt scanners yield results with higher accuracy, we have not only added pre-processing but also Regular Expressions (Regex) and some Artificial Intelligence (AI) models to the formula. 

Let’s start with a successful case first – FormX played an important role in streamlining the vetting process of a non-government organization’s disbursement program by enabling them to digitize data from images, forms, and physical documents from [43,000](<https://www.linkedin.com/posts/googlehk_vision-ai-derive-image-insights-via-ml-activity-6609684625419837440-b4BE/>) applications.

We will dive deep into parts where data is captured and extracted. While FormX can pull data off all kinds of physical forms and documents, for the sake of readability, general receipts will be used as a primary example throughout this article.  


![](/images/blog/614d74a011af4d4a07051081_receipts.jpeg)

PHOTO BY [CARLI JEEN](<https://unsplash.com/@carlijeen?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText>) ON [UNSPLASH](<https://unsplash.com/@carlijeen?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText>)

### Proposed Stages to Solve the Problem

The foremost problem we want to solve here is how to extract {amount}, {date}, and {time} from various receipts.

All sorts of receipts with different layouts exist out there, which make it challenging to extract just the amount, date and time. We came up with a solution that has four main stages:

  1. Get text data out from receipt images with OCR technology.
  2. Filter outliers and group text data into horizontal lines.
  3. Find candidates from horizontal lines.
  4. Classify candidates with AI models and return positive ones.



These will be elaborated on in later sections.

We spent a considerable amount of time in the fourth stage above by experimenting on AI models and tweaking parameters. However, we’d like to emphasize that pre-processing (stages 1 to 3) are equally important. They improve the quality of text data, which, in turn, improves the final classification result.  


### OCR on Receipt via Google Vision

This is the first stage where a receipt image is converted to a collection of text with the aid of Google Vision API.

Whether the image is for training AI models or is actually a receipt that will have its information extracted, it is always passed to Google’s Text Detection API to have its text recognized. It’s worth mentioning that – to enhance OCR accuracy, every image goes through a process of image warping first.

The returned result is represented by five hierarchies in this descending scale order: Page, Block, Paragraph, Word, and Symbol.

Each entity, no matter which hierarchy it belongs to, contains a text data and its bounding box (a collection of four vertices with x and y coordinates).

We only used the two most basic ones, Word and Symbol. The former is an array of Symbols, while the latter represents a character or punctuation mark. You can find more detailed definitions of these hierarchies on Google’s official [documentation](<https://cloud.google.com/vision/docs/fulltext-annotations>).

### Line Orientation Estimation

By this time we have the texts from receipt images stored under the Word and Symbol entities.

We will now group them into horizontal lines _relative_ to the receipt, sorted by the vertical offset of each from the top of receipt, stored as an array. Here’s the rationale behind it:

  * Information in receipts is almost always horizontally printed. Text items on the same horizontal line are much more likely to be related.
  * It removes Words that aren’t horizontal enough. The output from OCR can sometimes contain some vertical items, which aren’t our target data.
  * Different combinations of Words result in different meanings. Putting them together allows us to iterate through all possible ones.
  * Spacing between Words or Symbols is important. Once they are grouped within the same data instance, calculating the space length between them becomes easier.
  * Adjacent lines are also more likely to be related. To access them, we can simply move indices up and down as they are sorted instead of comparing the distance between a set of Words with another.
  * The images we receive can now have tilted angles.



![](/images/blog/614d758587c3947453c4ceb1_formextractor-behind-the-scenes-1.png)

FIGURE 1. RECEIPTS CAPTURED WITH TILTED ANGLE  
IMAGE SOURCE: [USC ANNENBERG MEDIA](<http://www.uscannenbergmedia.com/2019/09/20/paper-receipts-present-potential-hazard-to-the-environment/>)

Let’s take the green lines shown in the Figure 1 as example. Apart from the lines being relatively horizontal, the date and time on each receipt are on the same line. Of course, this isn’t the case for every receipt.

As a disclaimer, the example above is just a random image. In real life, receipts can be nowhere near as good and legible as we’d like them to be. For example, the receipt on the right receipt is covered. While we can accommodate tilted angles, we cannot see through covered information.

### Grouping Words into Horizontal Lines, with RANSAC

Each instance of Word comes with a set of four vertices, and with them is a vector of the Word which carries its direction. It can be calculated through the following:

![](/images/blog/614d75e7cd261846f80962df_formextractor-behind-the-scenes-2.png)

FIGURE 2. VECTOR DIRECTION OF A BOUNDING BOX

All the Words’ vectors are computed and stored as a matrix. Now we need to determine whether they are horizontally on the same line. Calculating the distance between each Word’s vector and the average vector from all Words seems a good approach. If the distance lies within a threshold, it is horizontal enough; otherwise, the Word is thrown away. Once all the words are checked, the valid ones can be grouped into lines sorted with their vertical offsets (i.e., y coordinates).

Although this method would filter out Words that are not horizontal enough, they may have already contaminated the calculation of the average vector. The filter process may end up as pointless, as the result wouldn’t be accurate.

Fortunately, there is a saying – when we see outliers , we RANSAC them! RANdom Sample Consensus (RANSAC) is an algorithm for robust-fitting a model in the presence of outliers, which, when implemented, will take them out (i.e., Words that don’t fit). To run a RANSAC, we will take the vector of each Word as data item.

Let’s say there’s a 70% chance to get one inlier (a value within a pattern) out of all Words by picking randomly. We have to be 99.99% sure that only inliers are picked according to this formula:

![](/images/blog/614d76033dd0723f94e58469_formextractor-behind-the-scenes-3.png)

FIGURE 3. FORMULA FOR PICKING INLIERS[  
](<http://www.pinterest.com/pin/create/bookmarklet/?url=https%3A%2F%2Fblog.oursky.com%2F2020%2F04%2F06%2Fformextractor-behind-the-scenes-how-artificial-intelligence-ai-is-used-to-extract-and-capture-data%2F&media=https%3A%2F%2Fblog.oursky.com%2Fwp-content%2Fuploads%2F2020%2F04%2Fformextractor-behind-the-scenes-3.png&description=%20Figure%203.%20Formula%20for%20picking%20inliers%20&is_video=false>)

**In Figure 3, the formula is where:**

  * **C** is the required confidence = 99.999%
  * **r** is inlier chance = 70%
  * **k** is the number of samples needed to fit a model, which is a vector in each run (i.e., one in each iteration)
  * **n** is the number of iteration needed to attain required confidence



To visualize the formula better, put the numbers in and do the math. You will see that the number of iterations (**n**) needed to have required confidence (**c**) in getting an inlier is >= 10 times.

In fact, 70% of inlier chance is pessimistic as the majority of Words on a receipt are horizontally printed. Setting this lower than the actual value ensures the outliers are eliminated. Plus, since we are picking one Word each time to check if it’s an inlier, k = 1.

Based on the n value computed with RANSAC, we ran 10 iterations through the unprocessed Words yielding an array of Words where 99.999% of them got to be inliers. The average vector can then be calculated.

Now we have an accurate average vector. Along with a threshold, we can calculate the distance of each Word’s vector against it to decide whether it is an inlier. Then all the inliers are grouped into horizontal lines with their y-axis values.

### Shortlist Candidates with Amount, Time and Date regex

Before we pass data to the AI classifier, we need to extract Candidates from the horizontal lines, mainly with regular expressions (regex). In this case, any text pattern that looks like price, date, or time will be considered as a candidate. Below is an example of regex for finding the amount and price candidates:

Let’s say there are two adjacent Words, 12/20 and 21/01/2020, in a horizontal line. The no-space candidate of concatenating the two is 12/2021/01/2020, which looks like a really messed up date and no one can tell what part is the year. If any part of this is the date we are seeking, we might end up missing it. The with-space version 12/20 21/01/2020 ensures the AI receives the separated Words, which will improve the chance of landing a match.

At this stage, we realized regex can be a very handy tool to net some candidates. Consequently, a regex builder is available on FormX’s portal assisting users to come up with a correct regex for their target document.

### AI – Binary Classifier

Three models have been trained for our respective needs: price, date, and time.

#### Addressing the Flood of Useless Metadata

Receipts often contain unwanted metadata like the grocery’s name and quantities of items purchased. If we simply train the classification model with an unprocessed dataset, the model will be extremely biased towards negative results and end up with an unbalanced dataset. To balance the dataset, we can multiply the data of amount, date, and time to a 1:1 ratio of positive and negative results.

#### Bag-of-Words (BoW) Model

A BoW model is employed to first classify texts. In a BoW model, a dictionary is built from words that appear in the receipt’s training dataset. If there are n unique words, the BoW model will be a vector with n dimensions.

Normally, a BoW model records the occurrence of words, but we don’t in our case. Every word in classification data (i.e., receipt image copy) will be matched against the BoW model. If the word can’t be found in that dictionary, it will be ignored.

For price data, the surrounding text on the same line will be computed against a BoW dictionary. If the current candidate doesn’t have the surrounding text matching the dictionary, they will be marked as false. For the others, the +/-1 lines are taken into account, as data on the date or time can reside across them.

#### Amount Classifier

The model we used for this is logistic regression (examining and describing the relationship between binary variables, such as pass/fail, win/lose, etc). These are the input parameters we used:

**Position in Receipt.** The Words and Symbols come with a bounding box property. With that we can determine their vertical position divided by the total number of lines. It’s less likely to have a price right at the top of a receipt, so the candidates at lower positions have better likelihood.

**Has Symbols.** For candidates, we check that symbols indicating price-related data exist in a pattern, such as “$”, “.”, and “,”.

**Range Checking.** The numeric values in candidates are checked against a set of ranges like <10, >= 10, and <100, or an extreme one, like >= 10000000. Biases will be given based on the matching ranges. This can be tweaked based on the receipt. For example, if we’ve now extracted the amount from a bunch of receipts from a luxury brand, the range should be on the upper side of the scale.

#### Date Classifier

The model we used for this is random forest (an ensemble of randomized decision trees) with the number of estimators at 300. These are the input parameters we used:

**Position in receipt.** This is calculated similarly to the Amount Classifier. Date usually shows up on the top or bottom, so candidates with a more central position have a reduced likeliness mark.

**Has Symbols.** We check for symbols that imply date-related data, such as a slash (/) or period (.). Having less than two occurrences of these improves the candidate’s probability of being a date. Having a full year is also an advantage. A candidate that has “2019” in it, for example, is more likely to be a date than another one which has only “19”. Months in English is also a good indicator, and a fully spelled out month, like “September”, is a plus.

Time and date are often printed on the same line or adjacent to each other, which we also take into consideration. Candidates with inconsistent delimiters will get penalized, such as 11/04-2019 over 11/04/2019. Some of the other factors we look at are:

  * 1/(current year – extracted year + 1)
  * If the time candidate is on the same line or +/- one line
  * If different separators are used



#### Time Classifier

The model we used for this is random forest with the number of estimators at 300. These are the input parameters we used:

**Position in receipt.** This is calculated similarly to Date Classifier. Like Date, Time usually shows up on the top or bottom so candidates with a more central position have a reduced likeliness mark.

**Has Symbols.** Candidates with “:” and empty space with less than 2 occurrences are more likely to be time. The ones with am or pm are also prime candidates. Similar to how Date is classified, candidates with Words that imply data related to Time will get extra marks.

![](/images/blog/614d768efbc1579df8aa23ab_alex-o9isBQ25H-g-unsplash-1160x774.jpeg)

PHOTO BY [ALEX](<https://unsplash.com/@alx_andru?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText>) ON [UNSPLASH](<https://unsplash.com/?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText>)

FormX provides a set of pre-trained templates, including receipts, business registration, passport, IDs, etc., so that everyone can easily [extract data from PDFs](/blog/extract-data-from-pdf-to-structured-data) or images without having to develop the technology.

To extract data from receipts with FormX, you can use our predefined Receipts template. After you sign in, click on “Receipts” on the left hand side, and simply upload your receipts to view the test result. Below is an image of the receipt and the JSON output.  


Aside from that, you can set up your own template, or Form as we call it, by following the steps below:

  * Click on the “Add New Form” button and select “My Documents don’t have a fixed format” as the layout of receipts are not identical.  




![](/images/blog/61ea442f47d11954e159f1ef_WZKL-ohKvfRx2JagGH1MHMeRV_wD5bkF86PSFmNlnX8Q1sTh9utAMTWUDVU3yhNBpb0BAku3W20Q-QgkaPQsoIxD0CFRkYRVWAqa_STmHf96deqmXxHro9Vflou0fBKzsg03lIvV.png)

  * Select “Receipt” as your document type and pick the auto extraction items you want.



![](/images/blog/61ea442fbc7ffb3c6f4b321a_Q4sTNVX0oEaWBxPQV5v4zkd2PnUT5XuPJVHMRrCeQ71XlyoWkYgj6Wg1qByxSSfByHDH_HaA0mczC97W-KGYjrtI-1GdGaNvUPDY0azzrUKtsrgblaD3-9ZVgz04EcURuS93-VG1.png)

  * Upload an image for testing.  




Your receipt extractor is then ready to go!  


FormX can digitize your receipts and integrate it with your systems to automate data extraction from receipts without having to write countless codes and maintain them afterwards. [Contact us](</schedule-demo>) to talk about your use cases and learn more about how FormX can help you become even more competitive in the digital era.   

