source('./R/Functions.R')

s3_bucket <- 'alpha-app-pq-tool'

library(shiny)
library(DT)
library(dplyr)
library(plyr)
library(ggplot2)
library(plotly)
library(wordcloud)
library(tm)
library(lsa)
library(cluster)
library(slam)
library(data.table) #Thanks Karik
library(shinythemes)
library(shinyBS)
library(scales)
library(readr)
library(rintrojs)
library(s3tools)

s3tools::download_file_from_s3("alpha-app-pq-tool/searchSpace.rda", "./Data/searchSpace.rda", overwrite =TRUE)
load(file = "./Data/searchSpace.rda")


# Define R_date date type - to read in Long Date format in csv
setAs("character", "R_date", function(from) as.Date(from, "%d %B %Y"))
setClass("R_date")

s3tools::download_file_from_s3("alpha-app-pq-tool/MoJwrittenPQs.csv", "./Data/MoJwrittenPQs.csv", overwrite =TRUE)
rawData <- read_csv("./Data/MoJwrittenPQs.csv")
data <- data.frame(rawData)
drops <- c("X1","Document_Number", "Corrected_Date")
tables_data <- data[ , !(names(data) %in% drops)]

s3tools::download_file_from_s3("alpha-app-pq-tool/topDozenWordsPerTopic.csv", "./Data/topDozenWordsPerTopic.csv", overwrite =TRUE)
topic_data <- read.csv("./Data/topDozenWordsPerTopic.csv")

s3tools::download_file_from_s3("alpha-app-pq-tool/topDozenWordsPerMember.csv", "./Data/topDozenWordsPerMember.csv", overwrite =TRUE)
member_data <- read.csv("./Data/topDozenWordsPerMember.csv")

merged_clusters <- ddply(
  data,
  .(Date, Answer_Date, Topic),
  summarize,
  Question_Text = paste0(Question_Text, collapse = " "))

#Search space for query vector
vocab <- search.space$dimnames[[1]]

# server functions for plotting
maxCount <- function(hist) {
  ggplot_build(hist)$data[[1]]$count %>% max()
}

yBreaks <- function(hist) {
  if(maxCount(hist) < 11) {
      1
    } else if(maxCount(hist) < 21) {
      2
    } else {
      5
    }
}

yMax <- function(hist) {
  ( floor(maxCount(hist) / yBreaks(hist)) + 1) * yBreaks(hist)
}

