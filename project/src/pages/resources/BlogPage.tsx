import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Calendar, User, ArrowRight, ArrowLeft } from 'lucide-react';

const BlogPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };
  // Sample blog posts data
  const blogPosts = [
    {
      id: 1,
      title: "Introducing Kaido.ai: AI-Powered Prediction Markets on BNB Chain",
      excerpt: "We're excited to announce the launch of Kaido.ai, a revolutionary prediction market platform powered by artificial intelligence and built on the BNB Smart Chain.",
      date: "November 1, 2025",
      author: "Kaido Team",
      category: "Announcements",
      image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1024&q=80"
    },
    {
      id: 2,
      title: "How Prediction Markets Harness the Wisdom of Crowds",
      excerpt: "Prediction markets have a long history of accurately forecasting events by aggregating the collective knowledge of participants. Learn how this concept works and why it's so powerful.",
      date: "May 5, 2025",
      author: "Dr. Sarah Chen",
      category: "Education",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1024&q=80"
    },
    {
      id: 3,
      title: "The Role of AI in Enhancing Prediction Markets",
      excerpt: "Artificial intelligence is transforming prediction markets by providing deeper insights, identifying patterns, and helping users make more informed decisions.",
      date: "May 10, 2025",
      author: "Alex Rivera",
      category: "Technology",
      image: "https://images.unsplash.com/photo-1677442135968-6bd241f40c8a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1024&q=80"
    },
    {
      id: 4,
      title: "KAIDO Token Economics: Understanding Our Platform's Native Token",
      excerpt: "A deep dive into the KAIDO token, its utility within our ecosystem, reduced fees (2% vs 10% for BNB), and the economic model designed to create sustainable value for all participants.",
      date: "November 5, 2025",
      author: "Michael Johnson",
      category: "Tokenomics",
      image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1024&q=80"
    },
    {
      id: 5,
      title: "Creating Successful Prediction Markets: Best Practices",
      excerpt: "Learn how to create engaging and successful prediction markets that attract participants and generate valuable insights.",
      date: "May 20, 2025",
      author: "Emma Wilson",
      category: "Guides",
      image: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1024&q=80"
    },
    {
      id: 6,
      title: "Community Spotlight: Meet Our Top Predictors",
      excerpt: "We highlight some of the most successful predictors on Kaido.ai and share their strategies and insights for crypto and sports predictions.",
      date: "November 10, 2025",
      author: "Kaido Team",
      category: "Community",
      image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1024&q=80"
    }
  ];

  // Categories for filter
  const categories = ["All", "Announcements", "Education", "Technology", "Tokenomics", "Guides", "Community"];
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Mobile Back Button */}
      <div className="md:hidden mb-4">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={handleBack}
          className="text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10"
        >
          Back
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Kaido Blog</h1>
        <p className="text-slate-300">Latest news, updates, and insights from the Kaido.ai team</p>
      </div>
      
      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((category, index) => (
          <button 
            key={index}
            className={`px-4 py-2 rounded-full text-sm ${
              category === "All" 
                ? "bg-purple-600 text-white" 
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* Featured Post */}
      <Card className="mb-8 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 md:h-auto overflow-hidden">
            <img 
              src={blogPosts[0].image} 
              alt={blogPosts[0].title} 
              className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
            />
          </div>
          <div className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center mb-2">
                <span className="bg-purple-600/20 text-purple-400 text-xs px-2 py-1 rounded-full">{blogPosts[0].category}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">{blogPosts[0].title}</h2>
              <p className="text-slate-300 mb-4">{blogPosts[0].excerpt}</p>
            </div>
            <div>
              <div className="flex items-center text-slate-400 text-sm mb-4">
                <User className="h-4 w-4 mr-1" />
                <span className="mr-4">{blogPosts[0].author}</span>
                <Calendar className="h-4 w-4 mr-1" />
                <span>{blogPosts[0].date}</span>
              </div>
              <Link to={`/blog/${blogPosts[0].id}`} className="inline-flex items-center text-purple-400 hover:text-purple-300">
                Read more <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogPosts.slice(1).map(post => (
          <Card key={post.id} className="overflow-hidden flex flex-col h-full">
            <div className="h-48 overflow-hidden">
              <img 
                src={post.image} 
                alt={post.title} 
                className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
              />
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex items-center mb-2">
                <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded-full">{post.category}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{post.title}</h3>
              <p className="text-slate-300 mb-4 flex-grow">{post.excerpt}</p>
              <div>
                <div className="flex items-center text-slate-400 text-sm mb-4">
                  <User className="h-4 w-4 mr-1" />
                  <span className="mr-4">{post.author}</span>
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{post.date}</span>
                </div>
                <Link to={`/blog/${post.id}`} className="inline-flex items-center text-purple-400 hover:text-purple-300">
                  Read more <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Pagination */}
      <div className="flex justify-center mt-8">
        <div className="flex space-x-2">
          <button className="w-10 h-10 rounded-md bg-slate-800 flex items-center justify-center text-white">1</button>
          <button className="w-10 h-10 rounded-md bg-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-600">2</button>
          <button className="w-10 h-10 rounded-md bg-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-600">3</button>
          <button className="w-10 h-10 rounded-md bg-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-600">...</button>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
