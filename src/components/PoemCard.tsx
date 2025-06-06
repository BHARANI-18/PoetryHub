import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, User } from 'lucide-react';
import { Poem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import toast from 'react-hot-toast';

interface PoemCardProps {
  poem: Poem;
  onLikeUpdate?: (poemId: string, newCount: number) => void;
}

const PoemCard: React.FC<PoemCardProps> = ({ poem, onLikeUpdate }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(poem.likes_count);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (user) {
      checkLikeStatus();
    }
  }, [user, poem._id]);

  const checkLikeStatus = async () => {
    try {
      const response = await apiClient.getLikeStatus(poem._id);
      setIsLiked(response.liked);
    } catch (error) {
      // User not logged in or error occurred
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to like poems');
      return;
    }

    setIsLiking(true);
    try {
      const response = await apiClient.toggleLike(poem._id);
      setIsLiked(response.liked);
      setLikesCount(response.likes_count);
      onLikeUpdate?.(poem._id, response.likes_count);
    } catch (error) {
      toast.error('Failed to update like');
    }
    setIsLiking(false);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.share({
        title: poem.title,
        text: poem.content.substring(0, 100) + '...',
        url: window.location.origin + `/poem/${poem._id}`
      });
    } catch (error) {
      // Fallback to clipboard if Web Share API is not supported
      navigator.clipboard.writeText(window.location.origin + `/poem/${poem._id}`);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <Link to={`/poem/${poem._id}`} className="block">
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-purple-200">
        {poem.is_featured && (
          <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium mb-4">
            Featured
          </div>
        )}
        
        <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
          {poem.title}
        </h3>
        
        {poem.image_url && (
          <img 
            src={`http://localhost:5000${poem.image_url}`} 
            alt={poem.title}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        )}
        
        <div className="text-gray-600 mb-4 line-clamp-4 leading-relaxed">
          {poem.content.split('\n').map((line, index) => (
            <span key={index}>
              {line}
              {index < poem.content.split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm text-gray-600">
            {poem.author?.username || 'Anonymous'}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(poem.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{likesCount}</span>
            </button>
            
            <div className="flex items-center space-x-1 text-gray-500">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{poem.comments_count}</span>
            </div>
          </div>
          
          <button
            onClick={handleShare}
            className="text-gray-500 hover:text-purple-600 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
        
        {poem.tags && poem.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {poem.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default PoemCard;