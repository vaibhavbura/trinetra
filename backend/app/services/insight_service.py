from typing import List

def generate_insights(engagement_score: float, retention_score: float, growth_score: float, consistency_score: float) -> List[str]:
    """
    Generate rule-based insights based on metric thresholds.
    Ranges are generally scaled to 0-100 or percentages depending on input context.
    For this MVP, we analyze Engagement, Retention, Growth, and Consistency.
    """
    insights = []
    
    # 1. Strengths
    if retention_score >= 75:
        insights.append(f"Strength: Outstanding retention ({retention_score:.1f}/100). Audiences are watching until the end.")
    elif engagement_score >= 80:
        insights.append(f"Strength: High engagement hook ({engagement_score:.1f}/100) driving strong initial interest.")
        
    # 2. Risks
    if retention_score < 40:
        insights.append(f"Risk: Low completion rates detected ({retention_score:.1f}/100). Significant drop-offs mid-episode.")
    if consistency_score < 40:
        insights.append(f"Risk: High variance in viewership ({consistency_score:.1f}/100). Series performance is unpredictable.")
        
    # 3. Opportunities
    if growth_score > 60:
        insights.append(f"Opportunity: View momentum is accelerating ({growth_score:.1f}/100). Capitalize on current upload velocity.")
    elif growth_score < 40:
        insights.append(f"Opportunity: Subscriber conversion is lagging. Consider in-video calls to action.")

    if not insights:
        insights.append("Stable performance across all scoring vectors.")
        
    return insights
