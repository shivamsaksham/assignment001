const express = require('express')
const lodash = require('lodash');
const app = express()


const port = 3000


const fetch_blogs =async ()=>{
  const options = {
    method:"GET",
    headers:{
      "x-hasura-admin-secret":"32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6"
    }
  }

  const resp = await fetch('https://intent-kit-16.hasura.app/api/rest/blogs', options)
  return await resp.json()
  
}

const searchBlog = (query , allblogs)=>{
  
  if (!query) {
    return []
  }
  const searchedBlog = lodash.filter(allblogs , (blog)=> lodash.includes(blog.title , query))
  return searchedBlog
}

const fetchBlogCache = lodash.memoize(fetch_blogs)
const searchBlogCache = lodash.memoize(searchBlog , (query , allblogs) => `${query}`)

const fetchMiddleWare = async (req , res , next)=>{
  
  try {
    const allBlogs = await fetchBlogCache()
    req.allblogs = allBlogs;
    next()
  } catch (error) {
    res.status(500).send('Unable to Fetch Blogs')
  }
}



const searchMiddleWare = (req, res, next)=>{
  const q = req.query.query
  const allBlogs = req.allblogs.blogs

  try {
    const foundBlogs = searchBlogCache(q , allBlogs)
    req.searchedBlogs = foundBlogs
    next()
  } catch (error) {
    res.status(500).send("Unable to perform search")
  }
}




app.get('/api/blog-stats', fetchMiddleWare , (req, res) => {
  const allblogs = req.allblogs.blogs

  const numberOfBlogs = lodash.size(allblogs)
  const blogWithLongestTitle = lodash.maxBy(allblogs , (blog)=> blog.title.length);
  const numberOfBlogsWithTheTitlePrivacy = lodash.size(lodash.filter(allblogs , (blog) => lodash.includes(blog.title , 'privacy')))
  const blogsWithUniqueTitle = lodash.uniqBy(allblogs , 'title')

  const data = {
    'totalBlogs':numberOfBlogs,
    'longestBlogTitle':blogWithLongestTitle.title,
    'blogsWithTitlePrivacy':numberOfBlogsWithTheTitlePrivacy,
    'uniqueBlogs': blogsWithUniqueTitle
  }
  res.status(200)
  res.send(data)

})




app.get('/api/blog-search', fetchMiddleWare , searchMiddleWare ,  (req , res)=>{

  const data = {
    'blogs':req.searchedBlogs
  }
  res.status(200).send(data)

})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})