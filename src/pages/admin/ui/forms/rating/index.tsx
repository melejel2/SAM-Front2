import { useState } from "react";

import { Card, CardBody, CardTitle, Rating, RatingItem } from "@/components/daisyui";

import PageMetaData from "@/components/PageMetaData";
import PageTitle from "@/components/PageTitle";

const RatingPage = () => {
    const [rating, setRating] = useState(2);
    const [halfRating, setHalfRating] = useState(5);
    return (
        <div>
            <PageMetaData title={"Rating - Forms"} />
            <PageTitle title={"Rating"} subMenu={"Forms"} />
            <div className="mt-6">
                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Default</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-5">
                                <Rating value={rating} onChange={setRating}>
                                    <RatingItem name="rating-1" className="mask mask-star" />
                                    <RatingItem name="rating-1" className="mask mask-star" />
                                    <RatingItem name="rating-1" className="mask mask-star" />
                                    <RatingItem name="rating-1" className="mask mask-star" />
                                    <RatingItem name="rating-1" className="mask mask-star" />
                                </Rating>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Color</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-5">
                                <Rating value={rating} onChange={setRating}>
                                    <RatingItem name="rating-2" className="mask mask-star-2 bg-orange-400" />
                                    <RatingItem name="rating-2" className="mask mask-star-2 bg-orange-400" />
                                    <RatingItem name="rating-2" className="mask mask-star-2 bg-orange-400" />
                                    <RatingItem name="rating-2" className="mask mask-star-2 bg-orange-400" />
                                    <RatingItem name="rating-2" className="mask mask-star-2 bg-orange-400" />
                                </Rating>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Icon</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-5">
                                <Rating value={rating} onChange={setRating} className="gap-1">
                                    <RatingItem name="rating-3" className="mask mask-heart bg-red-400" />
                                    <RatingItem name="rating-3" className="mask mask-heart bg-orange-400" />
                                    <RatingItem name="rating-3" className="mask mask-heart bg-yellow-400" />
                                    <RatingItem name="rating-3" className="mask mask-heart bg-lime-400" />
                                    <RatingItem name="rating-3" className="mask mask-heart bg-green-400" />
                                </Rating>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-base-100">
                        <CardBody>
                            <CardTitle>Half Star</CardTitle>
                            <div className="mt-1 flex flex-wrap gap-5">
                                <Rating value={halfRating} onChange={setHalfRating} className="" half>
                                    <RatingItem
                                        name="rating-10"
                                        className="mask mask-half-1 mask-star-2 bg-green-500"
                                    />
                                    <RatingItem
                                        name="rating-10"
                                        className="mask mask-half-2 mask-star-2 bg-green-500"
                                    />
                                    <RatingItem
                                        name="rating-10"
                                        className="mask mask-half-1 mask-star-2 bg-green-500"
                                    />
                                    <RatingItem
                                        name="rating-10"
                                        className="mask mask-half-2 mask-star-2 bg-green-500"
                                    />

                                    <RatingItem
                                        name="rating-10"
                                        className="mask mask-half-1 mask-star-2 bg-green-500"
                                    />
                                    <RatingItem
                                        name="rating-10"
                                        className="mask mask-half-2 mask-star-2 bg-green-500"
                                    />

                                    <RatingItem
                                        name="rating-10"
                                        className="mask mask-half-1 mask-star-2 bg-green-500"
                                    />
                                    <RatingItem
                                        name="rating-10"
                                        className="mask mask-half-2 mask-star-2 bg-green-500"
                                    />

                                    <RatingItem
                                        name="rating-10"
                                        className="mask mask-half-1 mask-star-2 bg-green-500"
                                    />
                                    <RatingItem
                                        name="rating-10"
                                        className="mask mask-half-2 mask-star-2 bg-green-500"
                                    />
                                </Rating>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default RatingPage;
